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
import Color from "@arcgis/core/Color.js";
import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";
import Track from "@arcgis/core/widgets/Track.js";
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
  centerLayer!: esri.FeatureLayer;
  locate!: esri.Locate;
  
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
      this.searchWidget.on("select-result", (event: any) => {
        const selectedResult = event.result;
        this.searchResGraphic = selectedResult;
        //console.log(selectedResult.attributes);
        console.log(this.searchWidget.resultGraphic.attributes);
        this.searchWidget.resultGraphic.symbol.color = new Color("lime");;
      });

      const trackSymbol = {
      type: "simple-marker",
              size: "12px",
              color: "green",
              outline: {
                color: "#efefef",
                width: "1.5px"
    }};

    //   let track = new Track({
    //       view: this.view,
    //       graphic: new Graphic({
    //         symbol: trackSymbol
    //       }),
    //       useHeadingEnabled: false
    //     });
      
    //   this.view.ui.add(track, "top-left");
      // track.start();

      this.locate = new Locate({
          view: this.view,
                graphic: new Graphic({
            symbol: trackSymbol
          }),
      });
      this.view.ui.add(this.locate, "top-left");

      this.addPoint(44.5, 26.02);


        this.view.on("click", (event: any) => {
      this.view.hitTest(event)
      .then((response: any) => {
        console.log("fbebf");
        console.log(this.searchResGraphic);
        var gr = response.results[0].graphic;
        // console.log(JSON.stringify(gr.attributes));
        // console.log(gr.layer.outFields);
        // console.log(gr.attributes[0]);
        if (gr.layer === this.centerLayer) {
          this.votingCenterGraphic = response.results[0].graphic;
          console.log("ttttt");
        }
        console.log(gr.attributes["Latitude"]); //bun
        console.log(gr.attributes.Latitude); // bun
      });
  });

      // this.handleClick();
      this.handlePopup();
      // this.handleClick();

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

  // this.view.on("click", (event: any) => {
  //     this.view.hitTest(event)
  //     .then((response: any) => {
  //       console.log("fbebf");
  //       console.log(this.searchResGraphic);
  //       var gr = response.results[0].graphic;
  //       // console.log(JSON.stringify(gr.attributes));
  //       // console.log(gr.layer.outFields);
  //       // console.log(gr.attributes[0]);
  //       console.log(gr.attributes["Latitude"]); //bun
  //       console.log(gr.attributes.Latitude); // bun
  //     });
  // });
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
      //this.addPoint(44.5, 26.02);
      this.addRoute();
      // this.getRoute();
      event
      //console.log(event.targe.content.graphic.attributes)
      //console.log(this.view.popup.selectedFeature.attributes);
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
    else if(event.action.id === "aux") {
      console.log("intrare aux");
      this.searchWidget.on("select-result", (event: any) => {
        console.log("am ajuns");
      });
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

    const auxAction = new ActionButton({
      title: "aux",
      id: "aux",
      //type: "button"
      //image: "Measure_Distance16.png"
    });
    
    const popupVotingCenters = new PopupTemplate ({
      // autocasts as new PopupTemplate()
      //actions: [measureThisAction],
      actions: [getToLocationAction, auxAction],
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


     this.centerLayer = votingCentersLayer;
  //   this.view.on("click", (event: any) => {
  //     this.view.hitTest(event)
  //     .then((response: any) => {
  //       console.log("fbebf");
  //       console.log(this.searchResGraphic);
  //       var gr = response.results[0].graphic;
  //       // console.log(JSON.stringify(gr.attributes));
  //       // console.log(gr.layer.outFields);
  //       // console.log(gr.attributes[0]);
  //       if (gr.layer === votingCentersLayer) {
  //         this.votingCenterGraphic = response.results[0].graphic;
  //         console.log("ttttt");
  //       }
  //       console.log(gr.attributes["Latitude"]); //bun
  //       console.log(gr.attributes.Latitude); // bun
  //     });
  // });


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

    // addRouter() {
    // const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    // this.view.on("click", (event) => {
    //   console.log("point clicked: ", event.mapPoint.latitude, event.mapPoint.longitude);
    //   if (event.native.shiftKey) {
    //   if (this.view.graphics.length === 0) {
    //     addGraphic("origin", event.mapPoint);
    //   } else if (this.view.graphics.length === 1) {
    //     addGraphic("destination", event.mapPoint);
    //     getRoute(); // Call the route service
    //   } else {
    //     this.view.graphics.removeAll();
    //     addGraphic("origin", event.mapPoint);
    //   }
    //   }
    // });

    // var addGraphic = (type: any, point: any) => {
    //   const graphic = new Graphic({
    //     symbol: {
    //       type: "simple-marker",
    //       color: (type === "origin") ? "white" : "black",
    //       size: "8px"
    //     } as any,
    //     geometry: point
    //   });
    //   this.view.graphics.add(graphic);
    // }

    addRoute() {

      var addGraphic = (type: any, point: any) => {
        const graphic = new Graphic({
          symbol: {
            type: "simple-marker",
            color: (type === "origin") ? "white" : "black",
            size: "8px"
          } as any,
          geometry: point
        });
        this.view.graphics.add(graphic);
      }
      if (this.view.graphics.length === 3) {
        // console.log("dubidubi");
        console.log("2 pct si ruta");
        this.view.graphics.pop();
        this.view.graphics.pop();
        addGraphic("destination", this.votingCenterGraphic.geometry);
        this.getRoute();
      }
      else if (this.view.graphics.length === 1) {
        // let pt = new Point({
        // longitude: 26.02,
        // latitude: 44.5
        // });
        // let g = new Point(this.votingCenterGraphic.geometry);
        // g.latitude = g.latitude + 0.02;
        // g.longitude = g.longitude + 0.03;
      //   const trackSymbol = {
      //   type: "simple-marker",
      //           size: "12px",
      //           color: "green",
      //           outline: {
      //             color: "#efefef",
      //             width: "1.5px"
      // }};
  
      // //   let track = new Track({
      // //       view: this.view,
      // //       graphic: new Graphic({
      // //         symbol: trackSymbol
      // //       }),
      // //       useHeadingEnabled: false
      // //     });
        
      // //   this.view.ui.add(track, "top-left");
      //   // track.start();
  
      //   const locate = new Locate({
      //       view: this.view,
      //             graphic: new Graphic({
      //         symbol: trackSymbol
      //       }),
      //   });
      //   this.view.ui.add(locate, "top-left");
        //addGraphic("origin", track.graphic.geometry);
        addGraphic("destination", this.votingCenterGraphic.geometry);
        console.log("branch 1");
        console.log(this.view.graphics.length);
        this.getRoute();
        // console.log(track.graphic);
        // console.log(this.view.graphics.at(0).geometry === g);
        //console.log(this.view.graphics.at(1).geometry === this.votingCenterGraphic.geometry);
  
      }
      // else if (this.view.graphics.length === 4) {
      //     console.log("1 pct dupa ruta");
      //     let origin = this.view.graphics.pop();
      //     this.view.graphics.removeAll();
      //     this.view.graphics.push(origin);
      //     addGraphic("destination", this.votingCenterGraphic.geometry);
      // }
      else if (this.view.graphics.length === 0) {
        console.log("automat de la geolocatie");
        this.locate.locate().then(()=>{
          addGraphic("destination", this.votingCenterGraphic.geometry);
          this.getRoute();
        })
      }
      else {
        console.log("sterge tot");
          this.view.graphics.removeAll();
      }
  
    }

    getRoute() {

      console.log("fbuburbgurgbur");
      //console.log(this.view.graphics.toArray())

      const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    //   var addGraphic = (type: any, point: any) => {
    //   const graphic = new Graphic({
    //     symbol: {
    //       type: "simple-marker",
    //       color: (type === "origin") ? "white" : "black",
    //       size: "8px"
    //     } as any,
    //     geometry: point
    //   });
    //   this.view.graphics.add(graphic);
    // }

    //addGraphic("origin", this.searchResGraphic.geometry);

    // if (this.view.graphics.length === 0) {
    //     addGraphic("origin", event.mapPoint);
    //   } else if (this.view.graphics.length === 1) {
    //     addGraphic("destination", event.mapPoint);
    //     getRoute(); // Call the route service
    //   } else {
    //     this.view.graphics.removeAll();
    //     addGraphic("origin", event.mapPoint);
    //   }

    console.log(this.view.graphics.length);
    //console.log(this.view.graphics.at(0).geometry == this.searchResGraphic.geometry);
    // if (this.view.graphics.length === 3) {
    //   // console.log("dubidubi");
    //   console.log("2 pct si ruta");
    //   this.view.graphics.pop();
    //   this.view.graphics.pop();
    //   addGraphic("destination", this.votingCenterGraphic.geometry);
    // }
    // else if (this.view.graphics.length === 1) {
    //   // let pt = new Point({
    //   // longitude: 26.02,
    //   // latitude: 44.5
    //   // });
    //   // let g = new Point(this.votingCenterGraphic.geometry);
    //   // g.latitude = g.latitude + 0.02;
    //   // g.longitude = g.longitude + 0.03;
    // //   const trackSymbol = {
    // //   type: "simple-marker",
    // //           size: "12px",
    // //           color: "green",
    // //           outline: {
    // //             color: "#efefef",
    // //             width: "1.5px"
    // // }};

    // // //   let track = new Track({
    // // //       view: this.view,
    // // //       graphic: new Graphic({
    // // //         symbol: trackSymbol
    // // //       }),
    // // //       useHeadingEnabled: false
    // // //     });
      
    // // //   this.view.ui.add(track, "top-left");
    // //   // track.start();

    // //   const locate = new Locate({
    // //       view: this.view,
    // //             graphic: new Graphic({
    // //         symbol: trackSymbol
    // //       }),
    // //   });
    // //   this.view.ui.add(locate, "top-left");
    //   //addGraphic("origin", track.graphic.geometry);
    //   addGraphic("destination", this.votingCenterGraphic.geometry);
    //   console.log("branch 1");
    //   console.log(this.view.graphics.length);
    //   // console.log(track.graphic);
    //   // console.log(this.view.graphics.at(0).geometry === g);
    //   //console.log(this.view.graphics.at(1).geometry === this.votingCenterGraphic.geometry);

    // }
    // else if (this.view.graphics.length === 4) {
    //     console.log("1 pct dupa ruta");
    //     let origin = this.view.graphics.pop();
    //     this.view.graphics.removeAll();
    //     this.view.graphics.push(origin);
    //     addGraphic("destination", this.votingCenterGraphic.geometry);
    // }
    // else if (this.view.graphics.length === 0) {
    //   console.log("automat de la geolocatie");
    //   this.locate.locate().then(()=>{
    //     addGraphic("destination", this.votingCenterGraphic.geometry);
    //   })
    // }
    // else {
    //   console.log("sterge tot");
    //     this.view.graphics.removeAll();
    // }

    //addGraphic("destination", this.votingCenterGraphic.geometry);

      const routeParams = new RouteParameters({
        stops: new FeatureSet({
          features: this.view.graphics.toArray()
        }),
        returnDirections: true,
        directionsLanguage: "en"
      });

      console.log("bbb");
      console.log(this.searchResGraphic);
      console.log("aaa");
      console.log(this.votingCenterGraphic);
      console.log(this.view.graphics.length);

      route.solve(routeUrl, routeParams).then((data: any) => {
        // console.log("data")
        console.log(data)
        for (let result of data.routeResults) {
          result.route.symbol = {
            type: "simple-line",
            color: [5, 150, 255],
            width: 3
          };
          this.view.graphics.add(result.route);
        }

        // Display directions
        if (data.routeResults.length > 0) {

      const directionsContainer = document.createElement("div");
      directionsContainer.className = "esri-widget esri-widget--panel";
      //directionsContainer.style.position = "absolute";
      directionsContainer.style.bottom = "10px";
      directionsContainer.style.right = "10px"; 
      // directionsContainer.style.bottom = "200px"; 

          const directions: any = document.createElement("div");
          directions.className = "esri-directions__scroller";
          // directions.style.padding = "200px";
          // directions.style.overflowY = "auto";
          // directions.style.marginTop = "0";
          directions.style.padding = "15px 15px 15px 30px";
          const features = data.routeResults[0].directions.features;

          let sum = 0;
          // Show each direction
          features.forEach((result: any, i: any) => {
            sum += parseFloat(result.attributes.length);
            const direction = document.createElement("li");
            direction.innerHTML = result.attributes.text + " (" + result.attributes.length + " miles)";
            directions.appendChild(direction);
          });

          const closeButton = document.createElement("button");
      // closeButton.innerHTML = "X";
      closeButton.className = "esri-widget-button esri-icon-close";
      closeButton.style.backgroundColor = "red";
      closeButton.style.position = "absolute";
      closeButton.style.right = "0px";
      // closeButton.style.left = "50 px";
      closeButton.onclick = () => {
        // this.view.ui.remove(directions);
        directionsContainer.remove();
        this.view.graphics.removeAll();
      };
      // directionsContainer.appendChild(directions);
      directionsContainer.appendChild(closeButton);
      directionsContainer.appendChild(directions);

          sum = sum * 1.609344;
          console.log('dist (km) = ', sum);
          //this.view.ui.empty("top-right");
          this.view.ui.add(directionsContainer, "bottom-right");
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }

    // getRoute();
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
