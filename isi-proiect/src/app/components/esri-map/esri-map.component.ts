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
