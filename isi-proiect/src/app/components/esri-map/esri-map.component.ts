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

import { Subscription } from "rxjs";

import Config from '@arcgis/core/config';
import Search from '@arcgis/core/widgets/Search';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Graphic from '@arcgis/core/Graphic';
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
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import Stop from "@arcgis/core/rest/support/Stop.js";
import Collection from "@arcgis/core/core/Collection.js";


import { FirebaseService} from "src/app/shared/services/database/firebase.service";

import {SimpleFillSymbol, SimpleMarkerSymbol} from "@arcgis/core/symbols";

import { MarkerSymbol } from "@arcgis/core/symbols";

import Legend from "@arcgis/core/widgets/Legend";


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
  featureLayer!: FeatureLayer;
  searchResGraphic!: esri.Graphic;
  votingCenterGraphic!: esri.Graphic;
  centersLayer!: esri.FeatureLayer;
  locate!: esri.Locate;
  routeLayer!: esri.GraphicsLayer;
  
  // Attributes
  zoom = 10;
  center: Array<number> = [26.10, 44.44];
  basemap = "arcgis/navigation";
  loaded = false;
  pointCoords: number[] = [26.10, 44.44];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;
  voting_places_number: number = 41;
  displayMode: string = "places";

  constructor(
    private fbs: FirebaseService,
  ) { }

  async initializeMap() { 
    try {
      const mapProperties: esri.WebMapProperties = {
        basemap: this.basemap
      };

      //Config.apiKey = "AAPKd74389863643403b89ce87e1504d639awQCjsgObn5bWJAbaVzD76umKlUIMdq45IrxoG3rf2ZdDupjUIsNZRZBSqOSGa8Dw";
      //Config.apiKey = "AAPKe431e50129804cc199e716062b45d9afTrhxbDpgvNhl-h49-T-nfBacoQRLwnW4iuBiCg9u3JD-ntXpGxKzCI7M_i7Q9RSJ";
      //Config.apiKey = "AAPK675199c30ad74b75a1c18cb1f33bac10zmARCb4N6A3ck9SvUrku5tnVYtm34vZOEtxf_cpnLNgIH5ASWBZ4XU4MpdvnEUqX";

      Config.apiKey = "AAPK675199c30ad74b75a1c18cb1f33bac10zmARCb4N6A3ck9SvUrku5tnVYtm34vZOEtxf_cpnLNgIH5ASWBZ4XU4MpdvnEUqX"

      this.map = new WebMap(mapProperties);
      
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      // this.featureLayer();

      // this.searchWidget = new Search({ view: this.view });
      // this.view.ui.add(this.searchWidget, "top-right");
      // this.searchWidget.on("select-result", (event: any) => {
      //   this.searchResGraphic = event.result;
      // });

      const locateSymbol = {
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
          symbol: locateSymbol
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
      this.addBestRouteButton();
      this.addChangeDisplayModeButton();

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");

    } catch (error) {
      console.log("EsriLoader: ", error);
    }

  }

  addBestRouteButton() {
    const getBestRouteButton = document.createElement("button");
    getBestRouteButton.className = "esri-widget-button esri-widget";
    getBestRouteButton.innerHTML = "Cea mai bună rută";
    getBestRouteButton.style.position = "absolute";
    getBestRouteButton.style.right = "250px";
    getBestRouteButton.style.width = "100px";
    getBestRouteButton.style.height = "40px";

    getBestRouteButton.onclick = () => {
      this.findBestRoute();
    };

    this.view.ui.add(getBestRouteButton, "top-right");
  }

  addChangeDisplayModeButton() {
    const changeDisplayModeButton = document.createElement("button");
    changeDisplayModeButton.className = "esri-widget-button esri-widget";
    changeDisplayModeButton.innerHTML = "Statistici";
    changeDisplayModeButton.style.position = "absolute";
    changeDisplayModeButton.style.right = "365px";
    changeDisplayModeButton.style.width = "100px";
    changeDisplayModeButton.style.height = "40px";

    changeDisplayModeButton.onclick = () => {
      if (this.displayMode === "statistics") {
        this.displayMode = "places";
        changeDisplayModeButton.innerHTML = "Statistici";
        this.clearFeatureLayers();
        this.addFeatureLayer();
        this.addLegend();
      }
      else {
        this.displayMode = "statistics";
        changeDisplayModeButton.innerHTML = "Secții de votare";
        this.clearFeatureLayers();
        this.addClusterLayer();
        this.view.ui.empty("bottom-left");
      }
    };

    this.view.ui.add(changeDisplayModeButton, "top-right");
  }

  findBestRoute() {

    this.locate.locate().then(()=>{
    
      if (this.routeLayer)
        this.routeLayer.destroy();
    
      this.routeLayer = new GraphicsLayer();

      var query = this.centersLayer.createQuery();
      query.outFields = ["*"];
      query.returnGeometry = true;

      this.centersLayer.queryFeatures(query).then((featureSet: { features: string | any[]; }) => {
          if (featureSet.features.length === 0) {
            return;
          }

          const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
            
          const routePromises = [];
          
          // Get route to each voting centre
          for (let i = 0; i < this.voting_places_number; i++) {

            const routeParams = new RouteParameters({
                  stops: new Collection([new Stop({geometry: this.locate.graphic.geometry}),
                                    new Stop({geometry: featureSet.features[i].geometry})]),
                  returnDirections: true,
                  directionsLanguage: "ro-RO"
              });
            
              const routePromise= route.solve(routeUrl, routeParams).then((data: any) => {
                  if (data.routeResults.length > 0) 
                      return [data, featureSet.features[i]];
                  
                  return null;
            }).catch((error: any) => {
                  console.log(error);
            });;

            routePromises.push(routePromise);
          }
        
        // After all the routes have been generated, choose the best one
        // allResults[i][0] - route data
        // allResults[i][0] - voting centre data
        Promise.all(routePromises)
          .then((allResults: any[]) => {
              let minRouteTime = 1000000;
              let bestRoute = null;
              
              for (let i = 0; i < allResults.length; i++) {
                
                let dir = allResults[i][0].routeResults[0].directions;
                let no_votants = allResults[i][1].attributes.Current_no_votants;
                
                // We assume that a votant spends 5 minutes at the voting centre
                if (dir.totalTime + 5 * no_votants < minRouteTime) {
                  minRouteTime = dir.totalTime + 5 * no_votants;
                  bestRoute = allResults[i][0];
                }
              
              }

              for (let result of bestRoute.routeResults) {
                result.route.symbol = {
                  type: "simple-line",
                  color: [5, 150, 255],
                  width: 3
                };
                this.routeLayer.add(result.route);
              }
      
              this.map.add(this.routeLayer);

              this.displayDirections(bestRoute);

        })
        .catch((error) => {
          // Handle errors
          console.error("Error in route.solve:", error);
        });

      });
    });
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


  clearFeatureLayers() {
    // Get all layers from the map
    const allLayers = this.map.layers.toArray();

    // Iterate through layers and remove feature layers
    allLayers.forEach(layer => {
      if (layer.type === "feature") {
        this.map.remove(layer);
      }
    });
  }

  addClusterLayer(): void  {

    const layer = new FeatureLayer({
      portalItem: {
        //id: "e92675ecf74e4159ac2bd21cd8629aad"
        id: "9b707dc6a20b4a0d9032b4cc93b15d94"
      },
      outFields: ["Name", "Address", "total_no_votes", "Current_no_votants"],
      renderer: new SimpleRenderer({
        symbol: new SimpleMarkerSymbol({
          style: 'circle',
          color: [250, 250, 250],
          outline: {
            color: [255, 255, 255, 0.5],
            width: 0.5
          }}),
        }
      ),
      
      featureReduction: {
        type: 'cluster',
        clusterRadius: "300px",
          popupTemplate: {
            title: "Statistici secții de votare",
            content: "Selectate {cluster_count} secții de votare, cu {expression/cluster_total_no_votes} voturi în total.",
            fieldInfos: [{
              fieldName: "cluster_count",
              format: {
                places: 0,
                digitSeparator: true
              }
            }
          ],
          expressionInfos: [{
            name: "cluster_total_no_votes",
            title: "cluster_total_no_votes",
            expression: `
              Expects($aggregatedFeatures, "total_no_votes")
              var cluster_total_no_votes = Sum($aggregatedFeatures, "total_no_votes");
              return \`\${Text(cluster_total_no_votes)}\`;
            `
          }]
          },
          clusterMinSize: "24px",
          clusterMaxSize: "60px",
          labelingInfo: [{
            deconflictionStrategy: "none",
            labelExpressionInfo: {
              expression: "Text($feature.cluster_count, '#,###')"
            },
            symbol: {
              type: "text",
              color: "#004a5d",
              font: {
                weight: "bold",
                family: "Noto Sans",
                size: "20px"
              }
            },
            labelPlacement: "center-center",
          }]
      }
    });

    this.map.add(layer);
    this.featureLayer = layer;
    this.centersLayer = layer;
  }

  addFeatureLayer(): void  {

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
          //id: "e92675ecf74e4159ac2bd21cd8629aad"
          id: "9b707dc6a20b4a0d9032b4cc93b15d94"
        },
        outFields: ["Name", "Address", "Current_no_votants"],
        popupTemplate: popupSection,
        renderer: rend,
      });
    
    this.map.add(layer);
    this.featureLayer = layer;
    this.centersLayer = layer;
}
  updateArcgisFeatureLayer(places: any[]): void {
    for (let place of places) {
      this.updateFeatureLayerElement(place.id, place.current_no_votants, place.total_votes);
    }
  }
   
  /* Updates one element, by id, from argcis feature layer*/
  updateFeatureLayerElement(id: number, no_of_votants: number, new_votes: number): void {
    const feature = new Graphic({
      attributes: {
        OBJECTID: id,
        Current_no_votants: no_of_votants,
        Total_no_votes: new_votes
      }
    });

    this.featureLayer.applyEdits({ updateFeatures: [feature] }).then((editsResult) => {
        //console.log(editsResult);
    });
  }

  connectFirebase() {
    this.fbs.connectToDatabase();
    // Get all places from ARCGIS and add them to FB
    for (let i = 1; i < this.voting_places_number; i++) {
      const query = this.featureLayer.createQuery();
      query.objectIds = [i];
      query.outFields = [ "*" ];
      
      this.featureLayer.queryFeatures(query).then((featureSet: { features: string | any[]; }) => {
        if (featureSet.features.length === 0) {
          return;
        }
        const feature = featureSet.features[0];
        let name = featureSet.features[0].attributes.Name;
        let lat = featureSet.features[0].geometry.latitude;
        let lng = featureSet.features[0].geometry.longitude;
        let total_votes = featureSet.features[0].attributes.Total_no_votes;
        let current_no_votants = featureSet.features[0].attributes.Current_no_votants;
        this.fbs.addPlaceItem(i, lat, lng, name, total_votes, current_no_votants);
      });
    }
    console.log("Firebase connected");
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
      this.displayDirections(data);

    }).catch((error: any) => {
      console.log(error);
    });
  }

  displayDirections(data : any) {
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
  }


  addLegend() {
    const legend = new Legend({
      view: this.view,
      layerInfos: [
        {
          layer: this.featureLayer,
          title: "Secții de votare"
        }
      ]
    });

    this.view.ui.add(legend, "bottom-left");
  }

  ngOnInit(): void {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
      this.search();
      this.addFeatureLayer();
      this.connectFirebase();
      this.addLegend();

      // Listen to firebase changes and update Arcgis remote feature layer
      this.fbs.getFeedPlaces().subscribe(data => {
        if (this.displayMode === "places") {
          this.updateArcgisFeatureLayer(data);
        }
      });
    });


  }

  ngOnDestroy(): void {
      
  }

}
