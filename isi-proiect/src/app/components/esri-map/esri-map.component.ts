import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
} from "@angular/core";

import Config from '@arcgis/core/config';
import Search from '@arcgis/core/widgets/Search';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import PopupTemplate from "@arcgis/core/PopupTemplate.js";
import ActionButton from "@arcgis/core/support/actions/ActionButton.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from '@arcgis/core/Graphic';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer.js';
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol.js";
import Color from "@arcgis/core/Color.js";
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";
import Locate from "@arcgis/core/widgets/Locate.js";

import * as locator from "@arcgis/core/rest/locator.js";

import esri = __esri; // Esri TypeScript Types

@Component({
  selector: 'app-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css']
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();
  @ViewChild("mapViewNode", { static: true }) private mapViewEl!: ElementRef;

  // Instances
  map!: esri.Map;
  view!: esri.MapView;
  pointGraphic!: esri.Graphic;
  graphicsLayer!: esri.GraphicsLayer;
  locator!: locator;
  reactiveUtils!: reactiveUtils;
  searchWidget!: Search;
  searchResGraphic!: esri.Graphic;
  votingCenterGraphic!: esri.Graphic;
  centersLayer!: esri.FeatureLayer;
  locate!: esri.Locate;
  routeLayer!: esri.GraphicsLayer;
  
  // Attributes
  zoom = 10;
  center: Array<number> = [26.06, 44.45];
  basemap = "arcgis/navigation";
  loaded = false;
  pointCoords: number[] = [26.06, 44.45];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;

  constructor() { }

  async initializeMap() { 
    try {
      const mapProperties: esri.WebMapProperties = {
        basemap: this.basemap
      };

      Config.apiKey = "AAPK675199c30ad74b75a1c18cb1f33bac10zmARCb4N6A3ck9SvUrku5tnVYtm34vZOEtxf_cpnLNgIH5ASWBZ4XU4MpdvnEUqX";

      this.map = new WebMap(mapProperties);
      

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      this.addFeatureLayers();

      this.searchWidget = new Search({ view: this.view });
      this.view.ui.add(this.searchWidget, "top-right");
      // this.searchWidget.on("select-result", (event: any) => {
      //   this.searchResGraphic = event.result;
      // });

      const localSymbol = {
        type: "simple-marker",
        size: "12px",
        color: "blue",
        outline: {
          color: "#efefef",
          width: "1.5px"
      }};

      this.locate = new Locate({
        view: this.view,
        graphic: new Graphic({
          symbol: localSymbol
        }),
      });
      
      this.view.ui.add(this.locate, "top-left");


      this.view.on("click", (event: any) => {
        this.view.hitTest(event).then((response: any) => {
          var gr = response.results[0].graphic;
       
          if (gr.layer === this.centersLayer) {
            this.votingCenterGraphic = response.results[0].graphic;
          }
      });
    });

      this.handlePopup();

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");

    } catch (error) {
      console.log("EsriLoader: ", error);
    }

  }



  handlePopup() {
    reactiveUtils.on(() => this.view.popup, "trigger-action", (event) => {
      if (event.action.id === "getToLocation") {
        this.getToLocation();
      }
    });
  }

  addFeatureLayers() {

    const getToLocationAction = new ActionButton({
      title: "Get to Location",
      id: "getToLocation",
      image: "http://static.arcgis.com/images/Symbols/Arrows/icon6.png"
    });
    
    const popupVotingCenters = new PopupTemplate ({
      actions: [getToLocationAction],
      title: "Voting Center",
      content: "{name}, {address}, {longitude}, {latitude}",
    });


    const rend = new SimpleRenderer({
      symbol: new PictureMarkerSymbol({
        url: "https://static.arcgis.com/images/Symbols/Emergency-Management/Law-Enforcement-Citizen-Complaint.png",  // Provide the path to your image
        width: 15,
        height: 15,
        xoffset: 0,
        yoffset: 0,
        angle: 0
      })
    });

    var votingCentersLayer: esri.FeatureLayer = new FeatureLayer({
      portalItem: {
        id: "9b707dc6a20b4a0d9032b4cc93b15d94"
      },
        outFields: ["latitude", "name"],
        popupTemplate: popupVotingCenters,
        renderer: rend
    });


    this.centersLayer = votingCentersLayer;

    this.map.add(votingCentersLayer);

    console.log("feature layers added");
  }
  

    getToLocation() {

      var addGraphic = (type: any, point: any) => {
        const graphic = new Graphic({
          symbol: {
            type: "simple-marker",
            color: (type === "origin") ? "white" : "black",
            size: "8px"
          } as any,
          geometry: point
        });
        this.routeLayer.add(graphic);
      }

      if (this.routeLayer)
        this.routeLayer.destroy();
      
      this.routeLayer = new GraphicsLayer();

      this.locate.locate().then(()=>{
        addGraphic("origin", this.locate.graphic.geometry);
        addGraphic("destination", this.votingCenterGraphic.geometry);
        this.getRoute();
      })  
  
    }

    getRoute() {

      const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

      const routeParams = new RouteParameters({
        stops: new FeatureSet({
          features: this.routeLayer.graphics.toArray()
        }),
        returnDirections: true,
        directionsLanguage: "ro-RO"
      });


      route.solve(routeUrl, routeParams).then((data: any) => {

        for (let result of data.routeResults) {
          result.route.symbol = {
            type: "simple-line",
            color: [5, 150, 255],
            width: 3
          };
          this.routeLayer.add(result.route);
        }

        this.map.add(this.routeLayer);

        // Display directions
        if (data.routeResults.length > 0) {

          const directionsContainer = document.createElement("div");
          directionsContainer.className = "esri-widget esri-widget--panel";
          directionsContainer.style.bottom = "10px";
          directionsContainer.style.right = "10px"; 

          const directions: any = document.createElement("div");
          directions.className = "esri-directions__scroller";
          directions.style.padding = "15px 15px 15px 30px";
          const features = data.routeResults[0].directions.features;

          // Show each direction
          features.forEach((result: any, i: any) => {
            const direction = document.createElement("li");
            let km = result.attributes.length * 1.609344;
            
            if (km < 1)
              direction.innerHTML = result.attributes.text + " (" + Math.round(km * 1000) + " m)";
            else
              direction.innerHTML = result.attributes.text + " (" + Math.round(km) + " Km)";
            
            directions.appendChild(direction);
          });

          const closeButton = document.createElement("button");
          closeButton.className = "esri-widget-button esri-icon-close";
          closeButton.style.backgroundColor = "red";
          closeButton.style.position = "absolute";
          closeButton.style.right = "0px";

          closeButton.onclick = () => {
            directionsContainer.remove();
            this.routeLayer.destroy();
          };

          directionsContainer.appendChild(closeButton);
          directionsContainer.appendChild(directions);

          this.view.ui.empty("bottom-right");
          this.view.ui.add(directionsContainer, "bottom-right");
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }


  ngOnInit(): void {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy(): void {
      
  }

}
