import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy,
  Query,
} from "@angular/core";

import Config from '@arcgis/core/config';
import Search from '@arcgis/core/widgets/Search';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";

import PopupTemplate from "@arcgis/core/PopupTemplate.js";
import ActionButton from "@arcgis/core/support/actions/ActionButton.js";
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

      //Config.apiKey = "AAPKd74389863643403b89ce87e1504d639awQCjsgObn5bWJAbaVzD76umKlUIMdq45IrxoG3rf2ZdDupjUIsNZRZBSqOSGa8Dw";
      Config.apiKey = "AAPKe431e50129804cc199e716062b45d9afTrhxbDpgvNhl-h49-T-nfBacoQRLwnW4iuBiCg9u3JD-ntXpGxKzCI7M_i7Q9RSJ";
      //Config.apiKey = "AAPK675199c30ad74b75a1c18cb1f33bac10zmARCb4N6A3ck9SvUrku5tnVYtm34vZOEtxf_cpnLNgIH5ASWBZ4XU4MpdvnEUqX";

      this.map = new WebMap(mapProperties);
      

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      this.featureLayer();

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

  search(): void {
    this.searchWidget = new Search({ view: this.view });
    this.view.ui.add(this.searchWidget, "top-right");
  }

  featureLayer(): void {
    /*var sectionLayer: esri.FeatureLayer = new FeatureLayer({
      url:
        "https://services6.arcgis.com/B4YC1JgDBly0js9x/arcgis/rest/services/sectii/FeatureServer"
    });
    this.map.add(sectionLayer);
    */

    /*
    const layer = new FeatureLayer({
      portalItem: {
        id: "9b707dc6a20b4a0d9032b4cc93b15d94"
      },
      outFields: ["Name", "Address", "Current_no_votants"],
      popupTemplate: popupSection
    });
    
    this.map.add(layer);
    */

    /*
    var sectionLayer: esri.FeatureLayer = new FeatureLayer({
      url:
        "https://services6.arcgis.com/N9xJwkvdyW8qjXA7/arcgis/rest/services/Sections/FeatureServer"
    });
    this.map.add(sectionLayer);
    */

    const getToLocationAction = new ActionButton({
      title: "Generează ruta",
      id: "getToLocation",
      image: "http://static.arcgis.com/images/Symbols/Arrows/icon6.png"
    });

    const popupSection = new PopupTemplate ({
      actions: [getToLocationAction],
      title: "Secție de Votare",
      content: "<b>Secție:</b> {Name}<br><b>Adresa:</b> {Address}<br><b>Votanți în secție:</b> {Current_no_votants}"
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

    const layer = new FeatureLayer({
      portalItem: {
        id: "e92675ecf74e4159ac2bd21cd8629aad"
      },
      outFields: ["Name", "Address", "Current_no_votants"],
      popupTemplate: popupSection,
      renderer: rend
    });
    
    this.map.add(layer);

    this.centersLayer = layer;

    /*
    const query = layer.createQuery();
    query.objectIds = [1];
    query.outFields = [ "*" ];
    
    layer.queryFeatures(query).then((featureSet: { features: string | any[]; }) => {
      if (featureSet.features.length === 0) {
        return;
      }
      // now update the desire attribute
      const feature = featureSet.features[0];
      console.log(featureSet.features[0].attributes.Current_no_votants);
      //console.log(feature.attributes);
      feature.attributes.Current_no_votants = 111;
      layer.applyEdits(
        feature,
        undefined,
      );
    });*/

    const feature = new Graphic({
      attributes: {
        OBJECTID: 1,
        Current_no_votants: 111
      }
    });

    /*
    {
      addFeatures: Graphic[]|Collection<Graphic>
      updateFeatures: Graphic[]|Collection<Graphic>
      deleteFeatures: Graphic[]|Collection<Graphic>|Object[]
      addAttachments: AttachmentEdit[]
      updateAttachments: AttachmentEdit[]
      deleteAttachments: String[]  
    }*/


      layer.applyEdits({ updateFeatures: [feature] }).then((editsResult) => {
          console.log(editsResult);
      });
  

    /*
    const graphicsLayer = new GraphicsLayer();
    layer.queryFeatures().then((result) => {
      result.features.forEach((feature) => {
        graphicsLayer.add(feature.clone());
      });
    });

    this.map.add(graphicsLayer);
    */
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
      this.search();
      this.featureLayer();
    });
  }

  ngOnDestroy(): void {
      
  }

}
