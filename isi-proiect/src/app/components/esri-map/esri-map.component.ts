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
import Point from '@arcgis/core/geometry/Point';
import * as locator from "@arcgis/core/rest/locator.js";
import { Subscription } from "rxjs";
import { FirebaseService} from "src/app/shared/services/database/firebase.service";



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
  
  // Attributes
  zoom = 10;
  center: Array<number> = [26.06, 44.45];
  basemap = "arcgis/navigation";
  loaded = false;
  pointCoords: number[] = [26.06, 44.45];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;
  voting_places_number: number = 41;

  // firebase sync
  subscriptionList!: Subscription;
  subscriptionObj!: Subscription;

  constructor(
    private fbs: FirebaseService,
  ) { }

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

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");

    } catch (error) {
      console.log("EsriLoader: ", error);
    }

  }

  search(): void {
    this.searchWidget = new Search({ view: this.view });
    this.view.ui.add(this.searchWidget, "top-right");
  }

  addFeatureLayer(): void {
    const popupSection = {
      "title": "Secție de Votare",
      "content": "<b>Secție:</b> {Name}<br><b>Adresa:</b> {Address}<br><b>Votanți în secție:</b> {Current_no_votants}"
    }

    const layer = new FeatureLayer({
      portalItem: {
        id: "e92675ecf74e4159ac2bd21cd8629aad"
      },
      outFields: ["Name", "Address", "Current_no_votants"],
      popupTemplate: popupSection
    });
    
    this.map.add(layer);

    this.featureLayer = layer;
  }

  updateAllPoints(places: any[]): void {
    for (let place of places) {
      this.updateFeatureLayer(place.id, place.current_no_votants, place.total_votes);
    }
  }

  updateFeatureLayer(id: number, no_of_votants: number, new_votes: number): void {
    const feature = new Graphic({
      attributes: {
        OBJECTID: id,
        Current_no_votants: no_of_votants,
        Total_no_votes: new_votes
      }
    });

    this.featureLayer.applyEdits({ updateFeatures: [feature] }).then((editsResult) => {
        console.log(editsResult);
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

      this.fbs.getFeedPlaces().subscribe(data => {
        console.log(data);
        this.updateAllPoints(data);
      });
    });


  }

  ngOnDestroy(): void {
      
  }

}
