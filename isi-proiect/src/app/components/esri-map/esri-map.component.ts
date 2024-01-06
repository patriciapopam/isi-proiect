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
import Point from '@arcgis/core/geometry/Point';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer.js';
import PictureMarkerSymbol from "@arcgis/core/symbols/PictureMarkerSymbol.js";

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
      
      this.addFeatureLayers();

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

    //   this.view.when(function() {
    //   on(thisview, "click", displayTractID);
    // });

    // function displayTractID(event) {
    //   var screenPoint = {
    //     x: event.x,
    //     y: event.y
    //   };

    //   // Search for graphics at the clicked location
    //   this.view.hitTest(screenPoint).then(function (response) {
    //     if (response.results.length) {
    //       var graphic = response.results.filter(function (result) {
    //       // check if the graphic belongs to the layer of interest
    //         return result.graphic.layer === census2000Layer;
    //       })[0].graphic;
          
    //       // do something with the result graphic
    //       console.log(graphic.attributes);
    //     }
    //   });
    // }

      this.searchWidget = new Search({ view: this.view });
      this.view.ui.add(this.searchWidget, "top-right");


      this.handlePopup();
      this.handleClick();

      //this.addRouter();

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");

    } catch (error) {
      console.log("EsriLoader: ", error);
    }

  }

  handleClick() {
    // this.view.on("click", (event) => {
    //   console.log("point clicked: ", event.mapPoint.latitude, event.mapPoint.longitude);
    //   // if (event.native.shiftKey) {
    //   // if (this.view.graphics.length === 0) {
    //   //   addGraphic("origin", event.mapPoint);
    //   // } else if (this.view.graphics.length === 1) {
    //   //   addGraphic("destination", event.mapPoint);
    //   //   getRoute(); // Call the route service
    //   // } else {
    //   //   this.view.graphics.removeAll();
    //   //   addGraphic("origin", event.mapPoint);
    //   // }
    //   // }
    // });

  this.view.on("click", (event: any) => {
      this.view.hitTest(event)
      .then((response: any) => {
        console.log("fbebf");
        var gr = response.results[0].graphic;
        console.log(JSON.stringify(gr.attributes));
        console.log(gr.layer.Latitude);
      });
  });
  }

  handlePopup() {
    // this.view.popup?.on("trigger-action",  (event) => {
    //     this.view.popup.title = "abc";
    //     console.log("ceva");
    //   if (event.action.id === "getToLocation") {
    //         this.addPoint(44.5, 26.02);
    //       }
    //   });

    reactiveUtils.on(
  () => this.view.popup,
  "trigger-action",
  (event) => {  // Execute the measureThis() function if the measure-this action is clicked
    console.log("ceva");
    if (event.action.id === "getToLocation") {
      this.addPoint(44.5, 26.02);
      event
      //console.log(event.targe.content.graphic.attributes)
      console.log(this.view.popup.selectedFeature.attributes);
      // console.log(this.view.popup.selectedFeature);
      console.log(this.view.popup.location.latitude);
      console.log(this.view.popup.location.longitude);
      console.log(this.view.popup.selectedFeature.geometry.type);
      const geom = this.view.popup.selectedFeature.geometry;
      if (geom.type === "point") {
        console.log("point");
          // const coordinates = {
          // x: geom.x,
          // y: geom.y
          // };
        //console.log(this.view.popup.selectedFeature.geometry.coordinates);
      }
      // console.log(this.view.popup.features);
      // console.log(this.view.popup.selectedFeatureWidget);
    }
});
  }

  addFeatureLayers() {

    const getToLocationAction = new ActionButton({
      title: "Get to Location",
      id: "getToLocation",
      //type: "button"
      //image: "Measure_Distance16.png"
    });
    
    const popupVotingCenters = new PopupTemplate ({
      // autocasts as new PopupTemplate()
      //actions: [measureThisAction],
      actions: [getToLocationAction],
      title: "Voting Center",
      content: "{name}, {address}, {longitude}, {latitude}",
    });

    // const trailheadsRenderer = new SimpleRenderer({
    //   "type": "simple",
    //   "symbol": {
    //     "type": "picture-marker",
    //     "url": "http://static.arcgis.com/images/Symbols/NPS/npsPictograph_0231b.png",
    //     "width": "18px",
    //     "height": "18px"
    //   }
    // });
/*
    const trailheadsLabels = {
      symbol: {
        type: "text",
        color: "#FFFFFF",
        haloColor: "#5E8D74",
        haloSize: "2px",
        font: {
          size: "12px",
          family: "Noto Sans",
          style: "italic",
          weight: "normal"
        }
      },

      labelPlacement: "above-center",
      labelExpressionInfo: {
        expression: "$feature.TRL_NAME"
      }
    };
*/

    const rend = new SimpleRenderer({
      symbol: new PictureMarkerSymbol({
        url: "http://static.arcgis.com/images/Symbols/NPS/npsPictograph_0231b.png",  // Provide the path to your image
        width: 20,  // Set the width of the image
        height: 20,  // Set the height of the image
        xoffset: 0,
        yoffset: 0,
        //type: "picture-marker",
        angle: 0
      })
    });
    // Trailheads feature layer (points)
    var votingCentersLayer: esri.FeatureLayer = new FeatureLayer({
      portalItem: {
        id: "9b707dc6a20b4a0d9032b4cc93b15d94"
      },
        //outFields: ["TRL_NAME","CITY_JUR","X_STREET","PARKING","ELEV_FT"],
        outFields: ["latitude", "name"],
        popupTemplate: popupVotingCenters,
        renderer: rend
    });


    // this.view.when(function() {
    //   on(this.view, "click", this.displayTractID);
    // });

    // function displayTractID(event) {
    //   var screenPoint = {
    //     x: event.x,
    //     y: event.y
    //   };

    //   // Search for graphics at the clicked location
    //   this.view.hitTest(screenPoint).then(function (response:any) {
    //     if (response.results.length) {
    //       var graphic = response.results.filter(function (result:any) {
    //       // check if the graphic belongs to the layer of interest
    //         return result.graphic.layer === votingCentersLayer;
    //       })[0].graphic;
          
    //       // do something with the result graphic
    //       console.log(graphic.attributes);
    //     }
    //   });
    // }

    this.map.add(votingCentersLayer);

//      reactiveUtils.on(
//   () => this.map.layers,
//   "click",
//   (event) => {  // Execute the measureThis() function if the measure-this action is clicked
//     console.log("tada");
    
// });


    // const geom = this.view.popup.selectedFeature.getAttribute("Name");

    console.log("feature layers added");

    // this.view.popup?.on("trigger-action", function (event) {
    //   if (event.action.id === "getToLocation") {
    //       console.log("Undefined");                          
    //   }
    // });
    // reactiveUtils.on(
    //   () => this.view,
    //   "trigger-action",
    //   (event) => {  // Execute the measureThis() function if the measure-this action is clicked
        
    //     console.log("Undefined");
    //     // if (event.action.id === "getToLocation") {
    //     //   this.getRouteToVotingCenter();
    //     // }
    // });
  }
  
  // getRouteToVotingCenter() {
  //   // const geom = this.view.popup.selectedFeature.attributes.content.address;
  //   console.log("am apasat pe popup");
  //   // const initDistance = geometryEngine.geodesicLength(geom, "miles");
  //   // const distance = parseFloat(Math.round(initDistance * 100) / 100).toFixed(2);
  //   // view.popup.content =
  //   //   view.popup.selectedFeature.attributes.name +
  //   //   "<div style='background-color:DarkGray;color:white'>" +
  //   //   distance +
  //   //   " miles.</div>";
  // }

  addPoint(lat: number, lng: number) {
    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);

    let point = new Point({
      longitude: lng,
      latitude: lat
    });

    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [50, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };
    
    this.pointGraphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayer.add(this.pointGraphic);
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
