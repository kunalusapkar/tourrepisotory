export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoia3VuYWx1c2Fwa2FyIiwiYSI6ImNrMnZwMHcyczA3Z20zbnFtc21teWZvOGMifQ.wa4yOmuHzay7--t_EtsuvQ';
  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/kunalusapkar/ck2vpo3aw0y8r1cs4iwxfan1f',
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Add marker
    new mapboxgl.Marker({
        element: el,
        anchor: 'bottom'
      })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add pop up
    new mapboxgl.Popup()
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}:${loc.description}</p>`)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30
    });

    // extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100
    }
  });
}