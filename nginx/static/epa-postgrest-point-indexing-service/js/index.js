var basemap,wktval,geojsonval,layer;

var pr_port = "3000";
var gs_port = "8080";

var rpc_stem = window.location.protocol + "//" + window.location.hostname + ":" + pr_port + "/rpc";
var geo_stem = window.location.protocol + "//" + window.location.hostname + ":" + gs_port + "/geoserver";

var point_index_url  = rpc_stem + "/point_index";
var random_point_url = rpc_stem + "/random_point";

document.getElementById("dz_run_service").disabled = true;
document.getElementById("pUseSimplifiedCatchments").disabled = true;
document.getElementById("busy").style.visibility = "hidden";

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

// Initialize marker point drawing tools
var drawnItems = new L.FeatureGroup().addTo(map);
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

// Add event to update the box and popup with WKT
map.on(L.Draw.Event.CREATED, function(e) {
  var type = e.layerType;
  var layer = e.layer;

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
});

// Add event to remove the WKT from the box and disable controls
map.on(L.Draw.Event.DELETED, function(e) {
  document.getElementById("dzWKT").value = "";
  document.getElementById("dz_run_service").disabled = true;
});

// Add layer to hold the service results
var snapline = L.geoJson().addTo(map);

var layer_items = {
  "Snap Line": snapline,
  "Flowlines": flowlines_ms,
  "Catchments SP": catchmentsp_ms,
  "Catchments": catchment_ms
};
L.control.layers(null, layer_items).addTo(map);

// Function to execute the service when button is pressed
function run_service() {
  dz_clear();
  busy_on();

  var pmethod = document.getElementById("dz_snap_type");

  var data = {
    "pPoint": geojsonval,
    "pIndexingEngine": pmethod.options[pmethod.selectedIndex].value,
    "pFCodeAllow": document.getElementById("pFCodeAllow").value,
    "pFCodeDeny": document.getElementById("pFCodeDeny").value,
    "pDistanceMaxDistKm": document.getElementById("dz_maxdistance").value,
    "pRaindropSnapMaxDistKm": document.getElementById("pRaindropMaxSnapDistance").value,
    "pRaindropPathMaxDistKm": document.getElementById("dz_maxdistance").value,
    "pReturnLinkPath": "TRUE",
    "pLimitInNetwork": document.getElementById("pLimitInNetwork").checked,
    "pLimitNavigable": document.getElementById("pLimitNavigable").checked,
    "pUseSimplifiedCatchments": document.getElementById("pUseSimplifiedCatchments").checked
  };
  
  L.esri.get(point_index_url, data, ptresponse);
}

function ptresponse(error, response) {
  busy_off();
  
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    return false;
  }
  
  var srv_rez = response[0];

  if (srv_rez == null || srv_rez.Output_Flowlines == null || srv_rez.Return_Code != 0) {
    if (srv_rez.Return_Code !== null) {
      document.getElementById("output").innerHTML = "<P>" + srv_rez.Status_Message + "</P>";
    } else {
      document.getElementById("output").innerHTML = "<P>No results found.</P>";
    }
    
    if (srv_rez.Return_Code != -20011) {
      return false;
    }
    
  }
  
  snapline.addData(srv_rez.Indexing_Line).setStyle({
    color: "#FF0000",
    fillColor: "#FF0000"
  });

  map.fitBounds(snapline.getBounds(), {
    maxZoom: 16
  });
  
  if (srv_rez.Return_Code == -20011) {
      return true;
    }

  var comid = srv_rez.Output_Flowlines.features[0].properties.ComID.toString();
  var permid = srv_rez.Output_Flowlines.features[0].properties.Permanent_Identifier;
  var reachcode = srv_rez.Output_Flowlines.features[0].properties.ReachCode;
  var hydroseq = srv_rez.Output_Flowlines.features[0].properties.HydroSeq;
  var measure = srv_rez.Output_Flowlines.features[0].properties.Snap_Measure.toString();
  var fcode = srv_rez.Output_Flowlines.features[0].properties.FCode.toString();
  var pathkm = srv_rez.Output_Flowlines.features[0].properties.Snap_DistanceKm.toString();
  pathkm = Math.round(pathkm * 100) / 100;

  document.getElementById("output").innerHTML =
    "<SPAN style='font-family: Arial; font-size: 14px;'><BR/>ComID: <B>" +
    comid + 
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</B> Perm ID: <B>" + 
    permid +
    "</B><BR/>Reach Code: <B>" +
    reachcode +
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</B>Measure: <B>" +
    measure +
    "</B><BR/>FCode: <B>" +
    fcode + 
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</B>Hydro Seq: <B>" +
    hydroseq + 
    "</B><BR/>Indexing Path Length: <B>" +
    pathkm + " km</B></SPAN>";
  
}

function run_random_point() {
  
  var randomy = document.getElementById("randomy");
  
  var data = {
    "pRegion": randomy.options[randomy.selectedIndex].value
  };

  // Use ESRI request module to call service via JSONP
  L.esri.get(
    random_point_url, 
    data, 
    rand_response
  );
}

function rand_response(error, response) {
  if (error) {
    document.getElementById("output").innerHTML = "<P>" + error + "</P>";
    busy_off();
    return false;
  }

  geojsonval = response[0];
  drawnItems.clearLayers();
  drawnItems.addLayer(
     L.geoJson({"type":"Feature", "geometry":geojsonval})
  );
  
  wktval = "POINT(" + geojsonval.coordinates[0] + " " + geojsonval.coordinates[1]  + ")";
  drawnItems.bindPopup(wktval);
  drawnItems.bindPopup(wktval + "</P>" + JSON.stringify(geojsonval));
  document.getElementById("dzWKT").value = wktval;
  
  run_service();

}

//Function to clear map on new request or Clear button
function dz_clear() {
  document.getElementById("output").innerHTML = "";
  snapline.clearLayers();
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
      maxZoom: 16
    });
  }
}

function menuOptions(choice) {
  if (choice == "DISTANCE" || choice == "DISTANCE_GEO") {
    document.getElementById("pFCodeAllow").disabled = false;
    document.getElementById("pFCodeDeny").disabled = false;
    document.getElementById("pLimitInNetwork").disabled = false;
    document.getElementById("pLimitNavigable").disabled = false;
    document.getElementById("dz_maxdistance").disabled = false;
    document.getElementById("pRaindropMaxSnapDistance").disabled = true;
    document.getElementById("pUseSimplifiedCatchments").disabled = true;
  } else if (choice == "RAINDROP") {
    document.getElementById("pFCodeAllow").disabled = false;
    document.getElementById("pFCodeDeny").disabled = false;
    document.getElementById("pLimitInNetwork").disabled = false;
    document.getElementById("pLimitNavigable").disabled = false;
    document.getElementById("dz_maxdistance").disabled = false;
    document.getElementById("pRaindropMaxSnapDistance").disabled = false;
    document.getElementById("pUseSimplifiedCatchments").disabled = true;
  } else if (choice == "CATCONSTRAINED" || choice == "CATCONSTRAINED_GEO") {
    document.getElementById("pFCodeAllow").disabled = true;
    document.getElementById("pFCodeDeny").disabled = true;
    document.getElementById("pLimitInNetwork").disabled = true;
    document.getElementById("pLimitNavigable").disabled = true;
    document.getElementById("dz_maxdistance").disabled = true;
    document.getElementById("pRaindropMaxSnapDistance").disabled = true;
    document.getElementById("pUseSimplifiedCatchments").disabled = false;
  }
}