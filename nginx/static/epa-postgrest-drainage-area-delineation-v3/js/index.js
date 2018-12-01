var wktval, geojsonval, layer;
var comid;
var measure;
var feature_type;
var split_check = true;
var snapline,basins,catchments,streams;

var pr_port = "3000";
var gs_port = "8080";

var rpc_stem = window.location.protocol + "//" + window.location.hostname + ":" + pr_port + "/rpc";
var geo_stem = window.location.protocol + "//" + window.location.hostname + ":" + gs_port + "/geoserver";

var drainage_delineation_url = rpc_stem + "/drainage_area_delineation_v3";
var random_point_url         = rpc_stem + "/random_point";

document.getElementById("dz_run_service").disabled = true;
document.getElementById("busy").style.visibility = "hidden";

var map = L.map("map").setView([46.874626,-96.782341],12);
mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data &copy; " + mapLink,
  maxZoom: 18
}).addTo(map);

flowlines_ms = L.tileLayer.wms(
    geo_stem + "/ows?"
   ,{
       layers: "nhdplus:nhdflowline_np21"
      ,transparent: 'true'
      ,format: 'image/png',
   }
);
flowlines_ms.addTo(map);

flowlines_ms.bindPopup(function (error, featureCollection) {
    if(error || featureCollection.features.length === 0) {
      return false;
    } else {
      return '<B>NHDPlus Flowline</B><BR/>'+ 
        'ComID: ' + featureCollection.features[0].properties.comid.toString() + '<BR/>' + 
        'Perm ID: ' + featureCollection.features[0].properties.permanent_identifier + '<BR/>' + 
        'Reach Code: ' + featureCollection.features[0].properties.reachcode + '<BR/>' + 
        'Hydro Seq: ' + featureCollection.features[0].properties.hydroseq.toString() + '<BR/>' + 
        'FMeasure: ' + featureCollection.features[0].properties.fmeasure.toString() + '<BR/>' + 
        'TMeasure: ' + featureCollection.features[0].properties.tmeasure.toString() + '<BR/>' + 
        'FCode: ' + featureCollection.features[0].properties.fcode.toString() + '<BR/>';
    }
  });

catchmentsp_ms = L.tileLayer.wms(
    geo_stem + "/ows?"
   ,{
       layers: "nhdplus:catchmentsp_np21"
      ,transparent: 'true'
      ,format: 'image/png',
   }
);

catchment_ms = L.tileLayer.wms(
    geo_stem + "/ows?"
   ,{
       layers: "nhdplus:catchment_np21"
      ,transparent: 'true'
      ,format: 'image/png',
   }
);

var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
var drawControl = new L.Control.Draw({
  draw: {
    polygon: false,
    polyline: false,
    rectangle: false,
    circle: false,
    marker: true,
    circlemarker: false
  },
  edit: {
    featureGroup: drawnItems,
    edit: false,
    remove: true
  }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function(e) {
  var type = e.layerType,
    layer = e.layer;
  drawnItems.clearLayers();
  geojsonval = e.layer.toGeoJSON().geometry;
  
  if (type === "marker") {
    wktval =
      "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
    layer.bindPopup(wktval + "</P>" + JSON.stringify(geojsonval));
  }

  document.getElementById("dzWKT").value = wktval;
  drawnItems.addLayer(layer);
  document.getElementById("dz_run_service").disabled = false;

  clear_ids();
  
});

map.on(L.Draw.Event.DELETED, function(e) {
  document.getElementById("dzWKT").value = "";
  document.getElementById("dz_run_service").disabled = true;
  clear_ids();
  
});

var gpService1, gpTask1, gpService2, gpTask2;
var pserver = document.getElementById("dz_server");
var pnavtype = document.getElementById("dz_navtype");

snapline = L.geoJson(null, {
  onEachFeature: onEachFeature_snapline
}).addTo(map);

streams = new L.GeoJSON(null, {
  onEachFeature: onEachFeature_streams
}).addTo(map);

basins = new L.GeoJSON(null, {
  onEachFeature: onEachFeature_basins
}).addTo(map);

catchments = new L.GeoJSON(null, {
  onEachFeature: onEachFeature_catchments
}).addTo(map);

var layer_items = {
  "Snap Line": snapline,
  "Returned Streams": streams,
  "Returned Drainage Area": basins,
  "Returned Catchments": catchments,
  "Flowlines": flowlines_ms,
  "Catchments SP": catchmentsp_ms,
  "Catchments": catchment_ms
};
L.control.layers(null, layer_items).addTo(map);

function onEachFeature_snapline(feature, layer) {
  if (feature.properties && feature.properties.LengthKm) {
    layer.bindPopup(
      "<B>Start Link Path</B><BR/>" + 
      "Length (Km): " + feature.properties.LengthKm.toString()
    );
  }
}
function onEachFeature_basins(feature, layer) {
  if (feature.properties && feature.properties.AreaSqKm) {
    layer.bindPopup(
      "<B>Returned Drainage Area</B><BR/>" + 
      "AreaSqKm: " + feature.properties.AreaSqKm.toString()
    );
  }
}
function onEachFeature_streams(feature, layer) {
  if (feature.properties && feature.properties.ComID) {
    layer.bindPopup(
      "<B>Returned Stream</B><BR/>" + 
      "Perm ID: " + feature.properties.Permanent_Identifier + "<BR/>" +
      "ComID: " + feature.properties.ComID.toString() + "<BR/>" +    
      "Reach Code: " + feature.properties.ReachCode + "<BR/>" +    
      "FMeasure: " + feature.properties.FMeasure.toString() + "<BR/>" +    
      "TMeasure: " + feature.properties.TMeasure.toString() + "<BR/>" +    
      "GNIS Name: " + feature.properties.GNIS_Name + "<BR/>"  
    );
  }
}
function onEachFeature_catchments(feature, layer) {
  if (feature.properties && feature.properties.FeatureID) {
    layer.bindPopup(
      "<B>Returned Catchment</B><BR/>" + 
      "FeatureID: " + feature.properties.FeatureID.toString() + "<BR/>" +
      "Area (SqKm): " + feature.properties.AreaSqKm.toString()             
    );
  }
}

function run_service() {
  dz_clear();
  busy_on();

  var pmethod = document.getElementById("pIndexingEngine");
  var pfeaturetype = document.getElementById("pFeatureType");
  var pdist, rpath;

  comid = document.getElementById("pStartComID").value;
  permid = document.getElementById("pStartPermanentIdentifier").value;
  reachcode = document.getElementById("pStartReachCode").value;
  hydroseq = document.getElementById("pStartHydroSequence").value;
  
  measure = document.getElementById("pStartMeasure").value;
  max_nav = document.getElementById("pSearchMaxDistanceKm").value;
  boo_split = document.getElementById("pSplitInitialCatchment").checked;
  boo_fill_holes = document.getElementById("pFillDrainageAreaHoles").checked;
  boo_return_streams = document.getElementById("pReturnStreams").checked;
  boo_return_catchments = document.getElementById("pReturnCatchments").checked;
  
  if (boo_return_streams && boo_return_catchments) {
    str_output_flag      = 'BOTH';
    str_return_streams   = 'TRUE';
    str_aggregation_flag = 'BOTH';
  } else if (boo_return_streams && ! boo_return_catchments) {
    str_output_flag      = 'BOTH';
    str_return_streams   = 'TRUE';
    str_aggregation_flag = 'TRUE';
  } else if (! boo_return_streams && boo_return_catchments) {
    str_output_flag      = 'FEATURE';
    str_return_streams   = 'FALSE';
    str_aggregation_flag = 'BOTH';
  } else if (! boo_return_streams && ! boo_return_catchments) {
    str_output_flag      = 'FEATURE';
    str_return_streams   = 'FALSE';
    str_aggregation_flag = 'TRUE';
  }
  
  var search_type = document.getElementById("pSearchType");

  // Load the parameters to pass to the service
  var data = {
    pStartPoint: geojsonval,
    pIndexingEngine: pmethod.options[pmethod.selectedIndex].value,
    pDistanceMaxDistKm: document.getElementById("pMaxDistance").value,
    pRaindropSnapMaxDistKm: document.getElementById("pRaindropMaxSnapDistance").value,
    pRaindropPathMaxDistKm: document.getElementById("pMaxDistance").value,
    pLimitInNetwork: "TRUE",
    pLimitNavigable: "TRUE",
    pFallbackMaxDistKm: document.getElementById("pMaxDistance").value,
    pFallbackLimitInNetwork: "TRUE",
    pFallbackLimitNavigable: "TRUE",
    pReturnLinkPath: "TRUE",
    pSearchType: search_type.options[search_type.selectedIndex].value,
    pStartComID: comid,
    pStartPermanentIdentifier: permid,
    pStartReachCode: reachcode,
    pStartHydroSequence: hydroseq,
    pStartMeasure: measure,
    pSearchMaxDistanceKm: max_nav,
    pFeatureType: pfeaturetype.options[pfeaturetype.selectedIndex].value,
    pOutputFlag: str_output_flag,
    pShowSelectedStreams: str_return_streams,
    pAggregationFlag: str_aggregation_flag,
    pSplitInitialCatchment: boo_split,
    pFillDrainageAreaHoles: boo_fill_holes
  };

  // Use ESRI request module to call service via JSONP
  L.esri.get(drainage_delineation_url, data, srvresponse);
}

function srvresponse(error, response, raw) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    busy_off();
    return false;
  }

  if (
    response[0] == null ||
    response[0].Result_Delineated_Area == null
  ) {
    document.getElementById("output").innerHTML = "<P>No results found.</P>";
    busy_off();
    return false;
  }
  
  if (
    response[0].Return_Code != 0
  ) {
    document.getElementById("output").innerHTML = "<P>" + response[0].Status_Message + "</P>";
    busy_off();
    return false;
  }

  if (
    response[0].Result_Link_Path != null
  ) {
    snapline
      .addData(response[0].Result_Link_Path)
      .setStyle({
        color: "#FF0000",
        fillColor: "#FF0000"
      });
  }
  
   if (
    response[0].Result_Streams_Selected != null
  ) {
    streams
      .addData(response[0].Result_Streams_Selected)
      .setStyle({
        color: "#FFFF00",
        fillColor: "#FFFF00"
      });
  }
  
  if (
    response[0].Result_Catchments_Selected != null
  ) {
    catchments
      .addData(response[0].Result_Catchments_Selected)
      .setStyle({
        color: "#FFFF00",
        fillColor: "#FFFF00"
      });
  }

  basins.addData(response[0].Result_Delineated_Area);
  map.fitBounds(basins.getBounds());
  
  streams.bringToFront();
  snapline.bringToFront();
  basins.bringToBack();
  catchments.bringToBack();
  flowlines_ms.bringToBack();
  catchmentsp_ms.bringToBack();
  
  busy_off();
}

function run_random_point() {
  clear_ids();
  
  var randomy = document.getElementById("randomy");

  var data = {
    pRegion: randomy.options[randomy.selectedIndex].value
  };

  // Use ESRI request module to call service via JSONP
  L.esri.get(random_point_url, data, rand_response);
}

function rand_response(error, response) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    busy_off();
    return false;
  }

  geojsonval = response[0];
  drawnItems.clearLayers();
  var geofeature = L.geoJson({type:"Feature",geometry:geojsonval});
  drawnItems.addLayer(geofeature);

  wktval =
    "POINT(" +
    geojsonval.coordinates[0] +
    " " +
    geojsonval.coordinates[1] +
    ")";
  drawnItems.bindPopup(wktval + "</P>" + JSON.stringify(geojsonval));
  document.getElementById("dzWKT").value = wktval;

  run_service();
}

//Function to clear map on new request or Clear button
function dz_clear() {
  document.getElementById("output").innerHTML = "";
  document.getElementById("notice").innerHTML = "";
  snapline.clearLayers();
  basins.clearLayers();
  streams.clearLayers();
  catchments.clearLayers();
  busy_off();
}

//Function to turn on the dorky animation
function busy_on() {
  document.getElementById("busy").style.visibility = "visible";
  document.body.style.cursor = "wait";
  document.getElementById("dz_run_service").disabled = true;
}

//Function to turn off the dorky animation
function busy_off() {
  document.getElementById("busy").style.visibility = "hidden";
  document.body.style.cursor = "auto";
  document.getElementById("dz_run_service").disabled = false;
}

// Function to produce WKT for the box and marker popup
// Uses Leaflet-Omnivore for WKT parsing
function updatewkt(wktString) {
  drawnItems.clearLayers();

  if (wktString == null || wktString == undefined || wktString == "") {
    document.getElementById("dz_run_service").disabled = true;
  } else {
    var layer;

    try {
      layer = omnivore.wkt.parse(wktString);
    } catch (layer) {
      alert("Unable to parse WKT geometry.");
      document.getElementById("dz_run_service").disabled = true;
      return null;
    }

    drawnItems.addLayer(layer);
    document.getElementById("dz_run_service").disabled = false;
    wktval = wktString;
    geojsonval = layer.toGeoJSON().features[0].geometry;
    layer.bindPopup(wktval + "</P>" + JSON.stringify(geojsonval));
    map.fitBounds(drawnItems.getBounds(), {
      maxZoom: 11
    });
  }
}

function clear_ids() {
  document.getElementById("pStartComID").value = '';
  document.getElementById("pStartPermanentIdentifier").value = '';
  document.getElementById("pStartReachCode").value = '';
  document.getElementById("pStartHydroSequence").value = '';
  document.getElementById("pStartMeasure").value = '';
}

function search_type_change() {
  var search_type = pSearchType.options[pSearchType.selectedIndex].value;
  if (search_type == "FN") {
    document.getElementById("pSearchMaxDistanceKm").disabled = true;
  } else {
    document.getElementById("pSearchMaxDistanceKm").disabled = false;
  }
}