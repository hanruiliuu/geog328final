mapboxgl.accessToken = 'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [-122.311165953808711, 47.615166803333196], // Initial map center
  zoom: 12 // Initial map zoom level
});

let highlightedRouteId = null;

map.on('load', () => {
  fetch('assets/Cleaned_Transit_Routes.geojson')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('GeoJSON data:', data); // Debugging log

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
              } else {
                console.warn('Invalid coordinate:', coord); // Debugging log
              }
            });
          });
        } else if (feature.geometry.type === 'LineString') {
          feature.geometry.coordinates.forEach(coord => {
            if (coord && !isNaN(coord[0]) && !isNaN(coord[1])) {
              bounds.extend(coord);
            } else {
              console.warn('Invalid coordinate:', coord); // Debugging log
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
                console.log(`Highlighted route ID: ${highlightedRouteId}`); // Debugging log
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

      // Add click event listener
      map.on('click', 'transitRoutesLayer', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const routeNum = e.features[0].properties.ROUTE_NUM;
        const objectId = e.features[0].properties.OBJECTID;
        const shapeLength = e.features[0].properties.SHAPE_Length;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0][0]) > 180) {
          coordinates[0][0] += e.lngLat.lng > coordinates[0][0] ? 360 : -360;
        }

        // Create a popup
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>Route Number:</strong> ${routeNum}<br><strong>Object ID:</strong> ${objectId}<br><strong>Shape Length:</strong> ${shapeLength}`)
          .addTo(map);

        // Highlight the selected route
        if (highlightedRouteId !== null) {
          map.setFeatureState(
            { source: 'transitRoutes', id: highlightedRouteId },
            { clicked: false }
          );
        }
        highlightedRouteId = e.features[0].id;
        map.setFeatureState(
          { source: 'transitRoutes', id: highlightedRouteId },
          { clicked: true }
        );
        console.log(`Highlighted route ID: ${highlightedRouteId}`); // Debugging log
      });

      // Change the cursor to a pointer when the mouse is over the routes
      map.on('mouseenter', 'transitRoutesLayer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (highlightedRouteId !== null) {
          map.setFeatureState(
            { source: 'transitRoutes', id: highlightedRouteId },
            { hover: false }
          );
        }
        highlightedRouteId = e.features[0].id;
        map.setFeatureState(
          { source: 'transitRoutes', id: highlightedRouteId },
          { hover: true }
        );
      });

      // Change it back to default when it leaves
      map.on('mouseleave', 'transitRoutesLayer', () => {
        map.getCanvas().style.cursor = '';
        if (highlightedRouteId !== null) {
          map.setFeatureState(
            { source: 'transitRoutes', id: highlightedRouteId },
            { hover: false }
          );
          highlightedRouteId = null;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching GeoJSON data:', error);
    });
});