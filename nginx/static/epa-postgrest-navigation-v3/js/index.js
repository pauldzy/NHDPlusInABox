var wktval,wktval2;
var basemap,start_geojsonval,stop_geojsonval;

var pr_port = "3000";
var gs_port = "8080";

var rpc_stem = window.location.protocol + "//" + window.location.hostname + ":" + pr_port + "/rpc";
var geo_stem = window.location.protocol + "//" + window.location.hostname + ":" + gs_port + "/geoserver";

var navigation_url =   rpc_stem + "/navigation_v3";
var random_point_url = rpc_stem + "/random_point";
var random_ppnav_url = rpc_stem + "/randomppnav";

document.getElementById("dz_run_service").disabled = true;
document.getElementById("busy").style.visibility = "hidden";
update_form();

var map = L.map("map").setView([46.874626,-96.782341],12);
mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';

basemap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "Map data &copy; " + mapLink,
  maxZoom: 18
});
basemap.addTo(map);

flowlines_ms = L.tileLayer.wms(
    geo_stem + "/ows?"
   ,{
       layers: "nhdplus:nhdflowline_np21"
      ,transparent: 'true'
      ,format: 'image/png',
   }
);
flowlines_ms.addTo(map);

flowlines_ms.bindPopup(function(error, featureCollection) {
  if (error || featureCollection.features.length === 0) {
    return false;
  } else {
    return (
      "<B>NHDPlus Flowline</B><BR/>" +
      "ComID: " +
      featureCollection.features[0].properties.comid.toString() +
      "<BR/>" +
      "Perm ID: " +
      featureCollection.features[0].properties.permanent_identifier +
      "<BR/>" +
      "Reach Code: " +
      featureCollection.features[0].properties.reachcode +
      "<BR/>" +
      "Hydro Seq: " +
      featureCollection.features[0].properties.hydroseq.toString() +
      "<BR/>" +
      "FMeasure: " +
      featureCollection.features[0].properties.fmeasure.toString() +
      "<BR/>" +
      "TMeasure: " +
      featureCollection.features[0].properties.tmeasure.toString() +
      "<BR/>" +
      "FCode: " +
      featureCollection.features[0].properties.fcode.toString() +
      "<BR/>" +
      "Length (Km): " +
      featureCollection.features[0].properties.lengthkm.toString() +
      "<BR/>"
    );
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
  var type = e.layerType;
  var layer = e.layer;

  var search_menu = document.getElementById("pSearchType");
  var search_type = search_menu.options[search_menu.selectedIndex].value;
  var layer_count = drawnItems.getLayers().length;

  if (search_type == "PP" || search_type == "PPALL") {
    if (layer_count == 2) {
      drawnItems.clearLayers();
      blank_wkts();
      blank_comids();
      document.getElementById("dz_run_service").disabled = true;
    }
  } else {
    if (layer_count == 1) {
      drawnItems.clearLayers();
      blank_wkts();
      blank_comids();
      document.getElementById("dz_run_service").disabled = true;
    }
  }

  if (type === "marker") {
    if (search_type == "PP" || search_type == "PPALL") {
      if (layer_count != 1) {
        wktval =
          "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
        start_geojsonval = layer.toGeoJSON().geometry;

        document.getElementById("dzWKT").value = wktval;
        layer.bindPopup(wktval + "</P>" + JSON.stringify(start_geojsonval));
        blank_start_comids();
      } else if (layer_count == 1) {
        wktval2 =
          "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
        stop_geojsonval = layer.toGeoJSON().geometry;
        document.getElementById("dzWKT2").value = wktval2;
        layer.bindPopup(wktval2 + "</P>" + JSON.stringify(stop_geojsonval));
        blank_stop_comids();

        document.getElementById("dz_run_service").disabled = false;
      }
    } else {
      wktval =
        "POINT(" + layer.getLatLng().lng + " " + layer.getLatLng().lat + ")";
      start_geojsonval = layer.toGeoJSON().geometry;

      document.getElementById("dzWKT").value = wktval;
      layer.bindPopup(wktval);
      blank_start_comids();

      document.getElementById("dz_run_service").disabled = false;
    }
  }

  drawnItems.addLayer(layer);
  check_start();
});

map.on(L.Draw.Event.DELETED, function(e) {
  var layer_count = drawnItems.getLayers().length;

  if (layer_count == 1) {
    document.getElementById("dzWKT2").value = "";
  } else {
    document.getElementById("dzWKT").value;
  }

  document.getElementById("dz_run_service").disabled = true;
});

var snapline = L.geoJson(null, {
  onEachFeature: onEachFeature_snapline
}).addTo(map);

var streams = new L.GeoJSON(null, {
  onEachFeature: onEachFeature_streams
}).addTo(map);

var catchments = new L.GeoJSON(null, {
  onEachFeature: onEachFeature_catchments
}).addTo(map);

var layer_items = {
  "Snap Line": snapline,
  "Returned Streams": streams,
  "Returned Catchments": catchments,
  "Flowlines": flowlines_ms,
  "Catchments SP": catchmentsp_ms,
  "Catchments": catchment_ms
};
L.control.layers(null, layer_items).addTo(map);

function onEachFeature_snapline(feature, layer) {
  if (feature.properties && feature.properties.LengthKm) {
    layer.bindPopup(
      "<B>" +
        feature.properties.name +
        "</B><BR/>" +
        "Length (Km): " +
        feature.properties.LengthKm.toString()
    );
  }
}
function onEachFeature_streams(feature, layer) {
  if (feature.properties && feature.properties.ComID) {
    layer.bindPopup(
      "<B>Returned Stream</B><BR/>" +
        "ComID: " +
        feature.properties.ComID.toString() +
        "<BR/>" +
        "Perm ID: " +
        feature.properties.Permanent_Identifier +
        "<BR/>" +
        "Reach Code: " +
        feature.properties.ReachCode +
        "<BR/>" +
        "Hydro Seq: " +
        feature.properties.HydroSequence.toString() +
        "<BR/>" +
        "FMeasure: " +
        feature.properties.FMeasure.toString() +
        "<BR/>" +
        "TMeasure: " +
        feature.properties.TMeasure.toString() +
        "<BR/>" +
        "GNIS Name: " +
        feature.properties.GNIS_Name +
        "<BR/>" +
        "Length (Km): " +
        feature.properties.LengthKm +
        "<BR/>" +
        "Network Distance (Km): " +
        feature.properties.NetworkDistanceKm +
        "<BR/>" 
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

  var index_engine = document.getElementById("pIndexingEngine");
  var search_type = document.getElementById("pSearchType");
  var eventlst = document.getElementById("dz_programs");
  
  boo_return_catchments = document.getElementById("pReturnCatchments").checked;
  if (boo_return_catchments) {
     str_return_catchments = "TRUE";
  } else {
     str_return_catchments = "FALSE";
  }
  
  boo_use_simplified_catchments = document.getElementById("pUseSimplifiedCatchments").checked;
  if (boo_use_simplified_catchments) {
     str_use_simplified_catchments = "TRUE";
  } else {
     str_use_simplified_catchments = "FALSE";
  }

  // Load the parameters to pass to the service
  var data = {
    "pStartPoint": start_geojsonval,
    "pStopPoint": stop_geojsonval,
    "pIndexingEngine": index_engine.options[index_engine.selectedIndex].value,
    "pDistanceMaxDistKm": document.getElementById("pMaxDistance").value,
    "pRaindropSnapMaxDistKm": document.getElementById("pRaindropMaxSnapDistance")
      .value,
    "pRaindropPathMaxDistKm": document.getElementById("pMaxDistance").value,
    "pLimitInNetwork": "TRUE",
    "pLimitNavigable": "TRUE",
    "pFallbackMaxDistKm": document.getElementById("pMaxDistance").value,
    "pFallbackLimitInNetwork": "TRUE",
    "pFallbackLimitNavigable": "TRUE",
    "pReturnLinkPath": "TRUE",
    "pReturnCatchments": str_return_catchments,
    "pUseSimplifiedCatchments": str_use_simplified_catchments,
    "pSearchType": search_type.options[search_type.selectedIndex].value,
    "pStartComID": document.getElementById("pStartComID").value,
    "pStartPermanentIdentifier": document.getElementById(
      "pStartPermanentIdentifier"
    ).value,
    "pStartReachCode": document.getElementById("pStartReachCode").value,
    "pStartHydroSequence": document.getElementById("pStartHydroSequence").value,
    "pStartMeasure": document.getElementById("pStartMeasure").value,
    "pStopComID": document.getElementById("pStopComID").value,
    "pStopPermanentIdentifier": document.getElementById(
      "pStopPermanentIdentifier"
    ).value,
    "pStopReachCode": document.getElementById("pStopReachCode").value,
    "pStopHydroSequence": document.getElementById("pStopHydroSequence").value,
    "pStopMeasure": document.getElementById("pStopMeasure").value,
    "pSearchMaxDistanceKm": document.getElementById("pSearchMaxDistanceKm").value
  };

  L.esri.get(navigation_url,data,navresponse);
  
}

function navresponse(error, response) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
  } else if (response == null) {
    if (response.Result_Link_Path != null) {
      snapline.addData(response.Result_Link_Path).setStyle({
        color: "#FF6347",
        fillColor: "#FF6347"
      });
    }
    document.getElementById("output").innerHTML = "<P>No results found.</P>";
  } else if (response.Return_Code != 0) {
    if (response.Result_Link_Path != null) {
      snapline.addData(response.Result_Link_Path).setStyle({
        color: "#FF6347",
        fillColor: "#FF6347"
      });
    }
    document.getElementById("output").innerHTML = "<P>" + response.Status_Message + "</P>";
  } else {
    if (response.Result_Link_Path != null) {
      snapline.addData(response.Result_Link_Path).setStyle({
        color: "#FF6347",
        fillColor: "#FF6347"
      });
    }

    if (response.Result_Streams_Selected != null) {
      streams.addData(response.Result_Streams_Selected).setStyle({
        color: "#FF0000",
        fillColor: "#FF0000"
      });
    }
    
    if (response.Result_Catchments_Selected != null) {
      catchments.addData(response.Result_Catchments_Selected).setStyle({
        color: "#FFA500",
        fillColor: "#FFA500"
      });
    }
    
    boo_autozoom = document.getElementById("autozoom").checked;
    if (boo_autozoom) {
       map.fitBounds(streams.getBounds());
    }
    
  }

  busy_off();
}

function run_random_point() {
  blank_comids();
  busy_on();
  
  var randomy = document.getElementById("randomy");
  var search_menu = document.getElementById("pSearchType");
  var search_type = search_menu.options[search_menu.selectedIndex].value;
  
  var data = {
     pRegion: randomy.options[randomy.selectedIndex].value
  };

  if ( search_type == 'PP' || search_type == 'PPALL' ) {
     L.esri.get(random_ppnav_url, data, randpp_response);
  } else {
     L.esri.get(random_point_url, data, rand_response);
  }
}

function rand_response(error, response) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    busy_off();
    return false;
  }

  start_geojsonval = response;
  drawnItems.clearLayers();
  var geofeature = L.geoJson({ type: "Feature", geometry: start_geojsonval });
  drawnItems.addLayer(geofeature);

  wktval =
    "POINT(" +
    start_geojsonval.coordinates[0] +
    " " +
    start_geojsonval.coordinates[1] +
    ")";
  drawnItems.bindPopup(wktval);
  document.getElementById("dzWKT").value = wktval;

  run_service();
}

function randpp_response(error, response) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    busy_off();
    return false;
  }

  blank_wkts();
  blank_start_comids();
  blank_stop_comids();
  
  document.getElementById("pStartComID").value   = response.ComID1;
  document.getElementById("pStartMeasure").value = response.Measure1;
  
  document.getElementById("pStopComID").value    = response.ComID2;
  document.getElementById("pStopMeasure").value  = response.Measure2;

  run_service();
}

function geojson2feature(p_geojson, p_popup_value, p_id) {
  if (p_geojson == undefined) {
    return null;
  }

  if (p_id == undefined || p_id == null) {
    p_id = 0;
  }

  p_feature = {
    type: "Feature",
    properties: {
      id: p_id,
      popupValue: p_popup_value
    },
    geometry: p_geojson
  };

  return p_feature;
}

function dz_clear() {
  busy_off();
  document.getElementById("output").innerHTML = "";
  snapline.clearLayers();
  streams.clearLayers();
  catchments.clearLayers();
}

function busy_on() {
  document.getElementById("busy").style.visibility = "visible";
  document.body.style.cursor = "wait";
  document.getElementById("dz_run_service").disabled = true;
}

function busy_off() {
  document.getElementById("busy").style.visibility = "hidden";
  document.body.style.cursor = "auto";
  document.getElementById("dz_run_service").disabled = false;
}

function blank_wkts() {
  drawnItems.clearLayers();
  document.getElementById("dzWKT").value = "";
  document.getElementById("dzWKT2").value = "";
}

function blank_wkt1() {
  document.getElementById("dzWKT").value = "";
  start_geojsonval = null;
}

function blank_wkt2() {
  document.getElementById("dzWKT2").value = "";
  stop_geojsonval = null;
}
 
function blank_comids() {
  blank_start_comids();
  blank_stop_comids();
}

function blank_start_comids() {
  document.getElementById("pStartComID").value = "";
  document.getElementById("pStartPermanentIdentifier").value = "";
  document.getElementById("pStartReachCode").value = "";
  document.getElementById("pStartHydroSequence").value = "";
  document.getElementById("pStartMeasure").value = "";
}

function blank_stop_comids() {
  document.getElementById("pStopComID").value = "";
  document.getElementById("pStopPermanentIdentifier").value = "";
  document.getElementById("pStopReachCode").value = "";
  document.getElementById("pStopHydroSequence").value = "";
  document.getElementById("pStopMeasure").value = "";
}

function check_start() {
  var search_menu = document.getElementById("pSearchType");
  var search_type = search_menu.options[search_menu.selectedIndex].value;

  var wkt1 = document.getElementById("dzWKT").value;
  var wkt2 = document.getElementById("dzWKT2").value;

  var com1 = document.getElementById("pStartComID").value;
  var per1 = document.getElementById("pStartPermanentIdentifier").value;
  var rch1 = document.getElementById("pStartReachCode").value;
  var hyd1 = document.getElementById("pStartHydroSequence").value;

  var com2 = document.getElementById("pStopComID").value;
  var per2 = document.getElementById("pStopPermanentIdentifier").value;
  var rch2 = document.getElementById("pStopReachCode").value;
  var hyd2 = document.getElementById("pStopHydroSequence").value;

  if (search_type != "PP" && search_type != "PPALL" && wkt1 !== null && wkt1 !== "") {
    document.getElementById("dz_run_service").disabled = false;
  } else if (
    ( search_type == "PP" || search_type == "PPALL" ) &&
    wkt1 !== null &&
    wkt1 !== "" &&
    wkt2 !== null &&
    wkt2 !== ""
  ) {
    document.getElementById("dz_run_service").disabled = false;
  } else {
    if (search_type == "PP" || search_type == "PPALL") {
      if (
        (com1 !== null && com1 !== "") ||
        (per1 !== null && per1 !== "") ||
        (rch1 !== null && rch1 !== "") ||
        (hyd1 !== null && hyd1 !== "") 
      ) {
        if (
          (com1 !== null && com1 !== "") ||
          (per1 !== null && per1 !== "") ||
          (rch1 !== null && rch1 !== "") ||
          (hyd1 !== null && hyd1 !== "")
        ) {
          document.getElementById("dz_run_service").disabled = false;
        } else {
          document.getElementById("dz_run_service").disabled = true;
        }
      }
    } else {
      if (
        (com1 !== null && com1 !== "") ||
        (per1 !== null && per1 !== "") ||
        (rch1 !== null && rch1 !== "") ||
        (hyd1 !== null && hyd1 !== "") 
      ) {
        document.getElementById("dz_run_service").disabled = false;
      } else {
        document.getElementById("dz_run_service").disabled = true;
      }
    }
  }
}

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

    layer.bindPopup(wktString);
    drawnItems.addLayer(layer);
    document.getElementById("dz_run_service").disabled = false;
    wktval = wktString;
    start_geojsonval = layer.toGeoJSON().features[0].geometry;
    map.fitBounds(drawnItems.getBounds(), {
      maxZoom: 11
    });
  }
}

function updatewkt2(wktString) {
  if (wktString == null || wktString == undefined || wktString == "") {
    document.getElementById("dz_run_service").disabled = true;
  } else {
    var layer;

    try {
      layer = omnivore.wkt.parse(wktString);
    } catch (layer) {
      alert("Unable to parse WKT geometry." + wktString);
      document.getElementById("dz_run_service").disabled = true;
      return null;
    }

    layer.bindPopup(wktString);
    drawnItems.addLayer(layer);
    document.getElementById("dz_run_service").disabled = false;
    wktval2 = wktString;
    stop_geojsonval = layer.toGeoJSON().features[0].geometry;
  }
}

function update_form() {
  var search_menu = document.getElementById("pSearchType");
  var search_type = search_menu.options[search_menu.selectedIndex].value;

  if (search_type == "PP" || search_type == "PPALL") {
    document.getElementById("pStopComID").disabled = false;
    document.getElementById("pStopPermanentIdentifier").disabled = false;
    document.getElementById("pStopReachCode").disabled = false;
    document.getElementById("pStopHydroSequence").disabled = false;
    document.getElementById("pStopMeasure").disabled = false;
    document.getElementById("dzWKT2").disabled = false;
    document.getElementById("pSearchMaxDistanceKm").disabled = true;
  } else {
    document.getElementById("pStopComID").disabled = true;
    document.getElementById("pStopPermanentIdentifier").disabled = true;
    document.getElementById("pStopReachCode").disabled = true;
    document.getElementById("pStopHydroSequence").disabled = true;
    document.getElementById("pStopMeasure").disabled = true;
    document.getElementById("dzWKT2").disabled = true;
    document.getElementById("pSearchMaxDistanceKm").disabled = false;
  }
  
  if (search_type == "FN") {
    document.getElementById("pSearchMaxDistanceKm").disabled = true;
  } else {
    document.getElementById("pSearchMaxDistanceKm").disabled = false;
  }
}