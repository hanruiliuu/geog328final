mapboxgl.accessToken = 'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-122.311165953808711, 47.615166803333196],
  zoom: 12
});

let highlightedRouteId = null;
const lightRailMarkers = [];
let lightRailVisible = false;

const addLayer = (id, type, source, layout, paint) => {
  map.addLayer({ id, type, source, layout, paint });
};

const setFeatureState = (source, id, state) => {
  map.setFeatureState({ source, id }, state);
};

const createPopup = (coordinates, html) => {
  new mapboxgl.Popup().setLngLat(coordinates).setHTML(html).addTo(map);
};

const fetchData = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
};

const addTransitRoutes = async () => {
  const data = await fetchData('../assets/Cleaned_Transit_Routes.geojson');
  data.features.forEach((feature, index) => {
    if (!feature.id) feature.id = index;
  });

  map.addSource('transitRoutes', { type: 'geojson', data });

  addLayer('transitRoutesLayer', 'line', 'transitRoutes', {
    'line-join': 'round',
    'line-cap': 'round'
  }, {
    'line-color': [
      'case',
      ['boolean', ['feature-state', 'clicked'], false],
      '#FF0000',
      'rgba(0, 0, 255, 0.5)'
    ],
    'line-width': [
      'case',
      ['boolean', ['feature-state', 'clicked'], false],
      4,
      2
    ]
  });

  const bounds = new mapboxgl.LngLatBounds();
  data.features.forEach(feature => {
    const coords = feature.geometry.type === 'MultiLineString' ? feature.geometry.coordinates.flat() : feature.geometry.coordinates;
    coords.forEach(coord => bounds.extend(coord));
  });
  map.fitBounds(bounds, { padding: 20 });

  const routeList = document.getElementById('routeList');
  const routeNumbers = [...new Set(data.features.map(feature => feature.properties.ROUTE_NUM))].sort((a, b) => a - b);

  const updateRouteList = (filter = '') => {
    routeList.innerHTML = '';
    routeNumbers.filter(routeNum => routeNum.toString().includes(filter)).forEach(routeNum => {
      const li = document.createElement('li');
      li.textContent = `Route ${routeNum}`;
      li.addEventListener('click', () => {
        const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
        if (routeFeature) {
          const routeBounds = new mapboxgl.LngLatBounds();
          const coords = routeFeature.geometry.type === 'MultiLineString' ? routeFeature.geometry.coordinates.flat() : routeFeature.geometry.coordinates;
          coords.forEach(coord => routeBounds.extend(coord));
          map.fitBounds(routeBounds, { padding: 20 });

          if (highlightedRouteId !== null) setFeatureState('transitRoutes', highlightedRouteId, { clicked: false });
          highlightedRouteId = routeFeature.id;
          setFeatureState('transitRoutes', highlightedRouteId, { clicked: true });
        }
      });
      li.addEventListener('mouseenter', () => {
        const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
        if (routeFeature) setFeatureState('transitRoutes', routeFeature.id, { hover: true });
      });
      li.addEventListener('mouseleave', () => {
        const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
        if (routeFeature) setFeatureState('transitRoutes', routeFeature.id, { hover: false });
      });
      routeList.appendChild(li);
    });
  };

  updateRouteList();
  document.getElementById('searchInput').addEventListener('input', (e) => updateRouteList(e.target.value));

  map.on('mouseenter', 'transitRoutesLayer', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    createPopup(e.lngLat, `<strong>Route Number:</strong> ${e.features[0].properties.ROUTE_NUM}`);
  });

  map.on('mouseleave', 'transitRoutesLayer', () => {
    map.getCanvas().style.cursor = '';
    document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());
  });

  map.on('click', (e) => {
    if (!map.queryRenderedFeatures(e.point, { layers: ['transitRoutesLayer'] }).length && highlightedRouteId !== null) {
      setFeatureState('transitRoutes', highlightedRouteId, { clicked: false });
      highlightedRouteId = null;
    }
  });

  map.on('click', 'transitStopsLayer', () => {
    if (highlightedRouteId !== null) {
      setFeatureState('transitRoutes', highlightedRouteId, { clicked: false });
      highlightedRouteId = null;
    }
  });

  document.getElementById('toggleBusRoutes').addEventListener('click', () => {
    const visibility = map.getLayoutProperty('transitRoutesLayer', 'visibility');
    map.setLayoutProperty('transitRoutesLayer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
  });
};

const addTransitStops = async () => {
  const data = await fetchData('../assets/Cleaned_Transit_Stops.geojson');
  map.addSource('transitStops', { type: 'geojson', data });

  addLayer('transitStopsLayer', 'circle', 'transitStops', {
    visibility: 'none'
  }, {
    'circle-radius': 6,
    'circle-color': '#FFFF00',
    'circle-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 0,
      12, 1
    ]
  });

  map.on('click', 'transitStopsLayer', (e) => {
    const { coordinates } = e.features[0].geometry;
    const { STOP_ID, STOP_STATUS, ACCESSIBILITY_DECAL } = e.features[0].properties;
    createPopup(e.lngLat, `<strong>Stop ID:</strong> ${STOP_ID}<br><strong>Status:</strong> ${STOP_STATUS}<br><strong>Accessibility Decal:</strong> ${ACCESSIBILITY_DECAL}`);
    if (highlightedRouteId !== null) {
      setFeatureState('transitRoutes', highlightedRouteId, { clicked: false });
      highlightedRouteId = null;
    }
  });

  map.on('mouseenter', 'transitStopsLayer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'transitStopsLayer', () => {
    map.getCanvas().style.cursor = '';
  });

  document.getElementById('toggleStops').addEventListener('click', () => {
    const visibility = map.getLayoutProperty('transitStopsLayer', 'visibility');
    map.setLayoutProperty('transitStopsLayer', 'visibility', visibility === 'visible' ? 'none' : 'visible');
  });
};

const addLightRailMarkers = async () => {
  const lightRailStations = await fetchData('../assets/light_rail_stations.json');

  lightRailStations.forEach(({ lng, lat, title }) => {
    const el = document.createElement('div');
    el.className = 'light-rail-marker';
    el.style.backgroundImage = "url('../assets/lightrail.png')";
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.backgroundSize = 'cover';

    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${title}</strong>`));

    lightRailMarkers.push(marker);

    // Add hover event listener
    el.addEventListener('mouseenter', () => {
      marker.togglePopup();
    });

    el.addEventListener('mouseleave', () => {
      marker.togglePopup();
    });
  });

  document.getElementById('toggleLightRail').addEventListener('click', () => {
    lightRailMarkers.forEach(marker => lightRailVisible ? marker.remove() : marker.addTo(map));
    lightRailVisible = !lightRailVisible;
  });
};

const addMedianIncomeHeatmap = async () => {
  const data = await fetchData('../assets/Cleaned_Median_Household_Income.geojson');
  map.addSource('medianIncome', { type: 'geojson', data });

  addLayer('medianIncomeHeatmap', 'heatmap', 'medianIncome', {
    visibility: 'none'
  }, {
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'median_household_income'],
      0, 0,
      100000, 1
    ],
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      15, 3
    ],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.1, 'rgb(103,169,207)',
      0.3, 'rgb(209,229,240)',
      0.5, 'rgb(253,219,199)',
      0.7, 'rgb(239,138,98)',
      1, 'rgb(178,24,43)'
    ],
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 2,
      15, 20
    ],
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      7, 0.8, // Increased opacity at zoom level 7
      15, 0.5 // Increased opacity at zoom level 15
    ],
  });

  map.on('mouseenter', 'medianIncomeHeatmap', (e) => {
    map.getCanvas().style.cursor = 'pointer';
    createPopup(e.lngLat, `<strong>Median Household Income:</strong> $${e.features[0].properties.median_household_income}`);
  });

  map.on('mouseleave', 'medianIncomeHeatmap', () => {
    map.getCanvas().style.cursor = '';
    document.querySelectorAll('.mapboxgl-popup').forEach(popup => popup.remove());
  });

  document.getElementById('toggleHeatmap').addEventListener('click', () => {
    const visibility = map.getLayoutProperty('medianIncomeHeatmap', 'visibility');
    map.setLayoutProperty('medianIncomeHeatmap', 'visibility', visibility === 'visible' ? 'none' : 'visible');
  });

  const heatmapLegend = document.getElementById('heatmapLegend');
  if (heatmapLegend) {
    const incomeRanges = [
      { color: 'rgba(33,102,172,0)', label: '< $20,000' },
      { color: 'rgb(103,169,207)', label: '$20,000 - $40,000' },
      { color: 'rgb(209,229,240)', label: '$40,000 - $60,000' },
      { color: 'rgb(253,219,199)', label: '$60,000 - $80,000' },
      { color: 'rgb(239,138,98)', label: '$80,000 - $100,000' },
      { color: 'rgb(178,24,43)', label: '> $100,000' }
    ];

    incomeRanges.forEach(range => {
      const legendItem = document.createElement('div');
      const colorBox = document.createElement('span');
      colorBox.style.backgroundColor = range.color;
      colorBox.className = 'legend-color-box';
      const label = document.createElement('span');
      label.textContent = range.label;
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      heatmapLegend.appendChild(legendItem);
    });
  } else {
    console.error('heatmapLegend element not found');
  }
};

map.on('load', () => {
  addTransitRoutes();
  addTransitStops();
  addLightRailMarkers();
  addMedianIncomeHeatmap();
});