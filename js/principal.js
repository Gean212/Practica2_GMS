// Objeto mapa
var mapa = L.map("mapaid", {
  center: [9.942092, -84.901137],
  zoom: 11,
});

// Capa base Positron de Carto
positromap = L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20,
  }
).addTo(mapa);

// Capa base de OSM
osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
});

// Capa base de ESRI World Imagery
esriworld = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution:
      "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  }
);

// Capas base
var mapasbase = {
  "Carto Positron": positromap,
  OpenStreetMap: osm,
  "ESRI WorldImagery": esriworld,
};

// Control de capas
control_capas = L.control
  .layers(mapasbase, null, { collapsed: true })
  .addTo(mapa);

// Control de escala
L.control.scale().addTo(mapa);

// Capa de coropletas de valor de zonas homogeneas en el cantón Puntarenas
$.getJSON("datos/zh2019.geojson", function (geojson) {
  var capa_zonas_homogeneas_coropletas = L.choropleth(geojson, {
    valueProperty: "VALOR",
    scale: ["yellow", "brown"],
    steps: 5,
    mode: "q",
    style: {
      color: "#fff",
      weight: 2,
      fillOpacity: 0.7,
    },
    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        "Nombre: " +
          feature.properties.NOMBRE_ZON +
          "<br>" +
          "Valor: " +
          "₡" +
          feature.properties.VALOR.toLocaleString()
      );
    },
  }).addTo(mapa);
  control_capas.addOverlay(
    capa_zonas_homogeneas_coropletas,
    "Valor de zonas homogéneas en el cantón Puntarenas"
  );

  // Leyenda de la capa de coropletas

  var leyenda = L.control({ position: "bottomleft" });
  leyenda.onAdd = function (mapa) {
    var div = L.DomUtil.create("div", "info legend");
    var limits = capa_zonas_homogeneas_coropletas.options.limits;
    var colors = capa_zonas_homogeneas_coropletas.options.colors;
    var labels = [];

    // Add min & max
    div.innerHTML =
      '<div class="labels"><div class="min">' +
      limits[0] +
      '</div> \
              <div class="max">' +
      limits[limits.length - 1] +
      "</div></div>";

    limits.forEach(function (limit, index) {
      labels.push('<li style="background-color: ' + colors[index] + '"></li>');
    });

    div.innerHTML += "<ul>" + labels.join("") + "</ul>";
    return div;
  };
  leyenda.addTo(mapa);
});

// Capa Patentes
$.getJSON("datos/pat.geojson", function (geodata) {
  var capa_pat = L.divIcon({
    html: '<i class="fa-solid fa-circle" style="color: black; font-size: 3px";></i>',
    iconSize: [20, 20], // Dimensiones del ícono
    iconAnchor: [10, 10], // Punto central del ícono
    className: "myDivIcon", // Clase personalizada para más estilos si es necesario
  });

  var capa_pat = L.geoJson(geodata, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, { icon: capa_pat });
    },
    style: function (feature) {
      return { color: "black", weight: 0.1, fillOpacity: 0.1 };
    },

    onEachFeature: function (feature, layer) {
      layer.bindPopup(
        "Finca: " +
          feature.properties.FINCA +
          "<br>" +
          "Patente: " +
          feature.properties.Número_de +
          "<br>" +
          "Nombre: " +
          feature.properties.Nombre_com.toLocaleString()
      );
    },
  });

  // Capa de puntos agrupados
  var capa_pat_agrupados = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
  });
  capa_pat_agrupados.addLayer(capa_pat);

  // Capa de calor (heatmap)
  coordenadas = geodata.features.map((feat) =>
    feat.geometry.coordinates.reverse()
  );
  var capa_pat_calor = L.heatLayer(coordenadas, { radius: 30, blur: 1 });

  // Se añaden la capas al mapa y al control de capas

  capa_pat.addTo(mapa);
  control_capas.addOverlay(
    capa_pat,
    "Patentes ubicadas en el cantón Puntarenas"
  );

  capa_pat_calor.addTo(mapa);
  control_capas.addOverlay(
    capa_pat_calor,
    "Capa de calor de registros de patentes"
  );

  // Se añade la capa al mapa y al control de capas
  capa_pat_agrupados.addTo(mapa);
  control_capas.addOverlay(
    capa_pat_agrupados,
    "Registros agrupados de patentes"
  );

  // Capa WMS de Límites Distritales
  var dist = L.tileLayer
    .wms("https://geos.snitcr.go.cr/be/IGN_5/wms?", {
      layers: "limitedistrital_5k",
      format: "image/png",
      transparent: true,
    })

    // Se agrega al control de capas como una capa de tipo "overlay"
    .addTo(mapa);
  control_capas.addOverlay(dist, "Límites Distritales");
});
