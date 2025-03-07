mapboxgl.accessToken = 'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-122.311165953808711, 47.615166803333196], // Initial map center
  zoom: 12 // Initial map zoom level
});

let highlightedRouteId = null;

map.on('load', () => {
  // Fetch and add transit routes
  fetch('assets/Cleaned_Transit_Routes.geojson')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Assign unique IDs to each feature if they don't already have one
      data.features.forEach((feature, index) => {
        if (!feature.id) {
          feature.id = index;
        }
      });

      map.addSource('transitRoutes', {
        type: 'geojson',
        data: data
      });

      // Add line layer for routes
      map.addLayer({
        id: 'transitRoutesLayer',
        type: 'line',
        source: 'transitRoutes',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'clicked'], false],
            '#FF0000', // Color for clicked routes
            '#0000FF'  // Default color (blue) for all routes
          ],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'clicked'], false],
            4, // Width for clicked routes
            2  // Default width for all routes
          ]
        }
      });

      // Fit the map to the bounds of the GeoJSON data
      const bounds = new mapboxgl.LngLatBounds();
      data.features.forEach(feature => {
        if (feature.geometry.type === 'MultiLineString') {
          feature.geometry.coordinates.forEach(line => {
            line.forEach(coord => {
              if (coord && !isNaN(coord[0]) && !isNaN(coord[1])) {
                bounds.extend(coord);
              }
            });
          });
        } else if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach(coord => {
            if (coord && !isNaN(coord[0]) && !isNaN(coord[1])) {
              bounds.extend(coord);
            }
          });
        }
      });
      map.fitBounds(bounds, { padding: 20 });

      // Create legend
      const routeList = document.getElementById('routeList');
      const routeNumbers = [...new Set(data.features.map(feature => feature.properties.ROUTE_NUM))];
      routeNumbers.sort((a, b) => a - b); // Sort route numbers

      function updateRouteList(filter = '') {
        routeList.innerHTML = '';
        routeNumbers
          .filter(routeNum => routeNum.toString().includes(filter))
          .forEach(routeNum => {
            const li = document.createElement('li');
            li.textContent = `Route ${routeNum}`;
            li.addEventListener('click', () => {
              const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
              if (routeFeature) {
                const routeBounds = new mapboxgl.LngLatBounds();
                if (routeFeature.geometry.type === 'MultiLineString') {
                  routeFeature.geometry.coordinates.forEach(line => {
                    line.forEach(coord => {
                      if (coord && !isNaN(coord[0]) && !isNaN(coord[1])) {
                        routeBounds.extend(coord);
                      }
                    });
                  });
                } else if (routeFeature.geometry.type === 'LineString') {
                  routeFeature.geometry.coordinates.forEach(coord => {
                    if (coord && !isNaN(coord[0]) && !isNaN(coord[1])) {
                      routeBounds.extend(coord);
                    }
                  });
                }
                map.fitBounds(routeBounds, { padding: 20 });

                // Highlight the selected route
                if (highlightedRouteId !== null) {
                  map.setFeatureState(
                    { source: 'transitRoutes', id: highlightedRouteId },
                    { clicked: false }
                  );
                }
                highlightedRouteId = routeFeature.id;
                map.setFeatureState(
                  { source: 'transitRoutes', id: highlightedRouteId },
                  { clicked: true }
                );
              }
            });
            li.addEventListener('mouseenter', () => {
              const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
              if (routeFeature) {
                map.setFeatureState(
                  { source: 'transitRoutes', id: routeFeature.id },
                  { hover: true }
                );
              }
            });
            li.addEventListener('mouseleave', () => {
              const routeFeature = data.features.find(feature => feature.properties.ROUTE_NUM === routeNum);
              if (routeFeature) {
                map.setFeatureState(
                  { source: 'transitRoutes', id: routeFeature.id },
                  { hover: false }
                );
              }
            });
            routeList.appendChild(li);
          });
      }

      updateRouteList();

      // Add search functionality
      const searchInput = document.getElementById('searchInput');
      searchInput.addEventListener('input', (e) => {
        updateRouteList(e.target.value);
      });

      // Show route number on hover
      map.on('mouseenter', 'transitRoutesLayer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.lngLat;
        const routeNum = e.features[0].properties.ROUTE_NUM;

        // Create a popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<strong>Route Number:</strong> ${routeNum}`)
          .addTo(map);
      });

      // Remove popup and reset cursor when leaving the route
      map.on('mouseleave', 'transitRoutesLayer', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups.length) {
          popups[0].remove();
        }
      });

      // Deselect route when clicking on the map
      map.on('click', (e) => {
        if (!map.queryRenderedFeatures(e.point, { layers: ['transitRoutesLayer'] }).length) {
          if (highlightedRouteId !== null) {
            map.setFeatureState(
              { source: 'transitRoutes', id: highlightedRouteId },
              { clicked: false }
            );
            highlightedRouteId = null;
          }
        }
      });

      // Deselect route when clicking on stops
      map.on('click', 'transitStopsLayer', () => {
        if (highlightedRouteId !== null) {
          map.setFeatureState(
            { source: 'transitRoutes', id: highlightedRouteId },
            { clicked: false }
          );
          highlightedRouteId = null;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching GeoJSON data:', error);
    });

  // Fetch and add transit stops
  fetch('assets/Cleaned_Transit_Stops.geojson')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      map.addSource('transitStops', {
        type: 'geojson',
        data: data
      });

      // Add circle layer for stops
      map.addLayer({
        id: 'transitStopsLayer',
        type: 'circle',
        source: 'transitStops',
        layout: {
          visibility: 'none' // Start with stops toggled off
        },
        paint: {
          'circle-radius': 6,
          'circle-color': '#FFFF00', // Yellow color for stops
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0,
            12, 1
          ]
        }
      });

      // Add click event listener for stops
      map.on('click', 'transitStopsLayer', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const stopId = e.features[0].properties.STOP_ID;
        const stopStatus = e.features[0].properties.STOP_STATUS;
        const accessibilityDecal = e.features[0].properties.ACCESSIBILITY_DECAL;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Create a popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>Stop ID:</strong> ${stopId}<br><strong>Status:</strong> ${stopStatus}<br><strong>Accessibility Decal:</strong> ${accessibilityDecal}`)
          .addTo(map);

        // Deselect route when clicking on stops
        if (highlightedRouteId !== null) {
          map.setFeatureState(
            { source: 'transitRoutes', id: highlightedRouteId },
            { clicked: false }
          );
          highlightedRouteId = null;
        }
      });

      // Change the cursor to a pointer when the mouse is over the stops
      map.on('mouseenter', 'transitStopsLayer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to default when it leaves
      map.on('mouseleave', 'transitStopsLayer', () => {
        map.getCanvas().style.cursor = '';
      });

      // Toggle stops visibility
      const toggleStopsButton = document.getElementById('toggleStops');
      toggleStopsButton.addEventListener('click', () => {
        const visibility = map.getLayoutProperty('transitStopsLayer', 'visibility');
        if (visibility === 'visible') {
          map.setLayoutProperty('transitStopsLayer', 'visibility', 'none');
        } else {
          map.setLayoutProperty('transitStopsLayer', 'visibility', 'visible');
        }
      });
    })
    .catch(error => {
      console.error('Error fetching GeoJSON data:', error);
    });

  // Fetch and add median household income data
  fetch('assets/Cleaned_Median_Household_Income.geojson')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      map.addSource('medianIncome', {
        type: 'geojson',
        data: data
      });

      // Add heatmap layer for median household income
      map.addLayer({
        id: 'medianIncomeHeatmap',
        type: 'heatmap',
        source: 'medianIncome',
        maxzoom: 15,
        paint: {
          // Increase the heatmap weight based on median_household_income
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'median_household_income'],
            0, 0,
            100000, 1
          ],
          // Increase the heatmap color weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3
          ],
          // Color ramp for heatmap. Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparency color
          // to create a blur-like effect.
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
          // Adjust the heatmap radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 20
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            15, 0
          ],
        }
      });

      // Show median_household_income on hover
      map.on('mouseenter', 'medianIncomeHeatmap', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.lngLat;
        const income = e.features[0].properties.median_household_income;

        // Create a popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<strong>Median Household Income:</strong> $${income}`)
          .addTo(map);
      });

      // Remove popup and reset cursor when leaving the heatmap
      map.on('mouseleave', 'medianIncomeHeatmap', () => {
        map.getCanvas().style.cursor = '';
        const popups = document.getElementsByClassName('mapboxgl-popup');
        if (popups.length) {
          popups[0].remove();
        }
      });

      // Toggle heatmap visibility
      const toggleHeatmapButton = document.getElementById('toggleHeatmap');
      toggleHeatmapButton.addEventListener('click', () => {
        const visibility = map.getLayoutProperty('medianIncomeHeatmap', 'visibility');
        if (visibility === 'visible') {
          map.setLayoutProperty('medianIncomeHeatmap', 'visibility', 'none');
        } else {
          map.setLayoutProperty('medianIncomeHeatmap', 'visibility', 'visible');
        }
      });

      // Create legend for heatmap
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
    })
    .catch(error => {
      console.error('Error fetching GeoJSON data:', error);
    });
});