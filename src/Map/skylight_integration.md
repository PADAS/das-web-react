# Skylight integration


CJ will handle the Django model modifications:

1. Add "Vector Layer" to Basemaps
2. Add JSON field for Vector Layer "layout" and "paint" config

Joshua

API Url:
https://sc-production.skylight.earth/api/

Skylight token:
GVVvUesOHJLuAIUU873SX817mftbiV

https://api.skylight.earth/vectorTiles/trackSubpath/{z}/{x}/{y}

Use transformRequest to add the token to the header if it's a skylight path:
```
var map = new mapboxgl.Map({
    ...{the rest of the setup config}
    transformRequest: function(url, resourceType) {
        if(resourceType !== 'Tile' || !url.includes('placeholder-skylight-url')) {
            return {
                url: url,
            };
        }

        return {
                url: url,
                headers: {
                    'Authorization': 'Bearer GVVvUesOHJLuAIUU873SX817mftbiV'
                }
            }

    }
});
```

# add source + layer to the map when the vector basemap is selected

# style using the `layout` and `paint` properties (start with basic lines and/or steal from skylight UI repo)

```
export const subpathLayer: LineLayerSpecification = {
  id: TRACKS_LAYER,
  type: 'line',
  source: SUBPATH_SOURCE_ID,
  'source-layer': 'hits',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
  paint: {
    'line-width': 2,
    'line-opacity': 0.2, // Start with low opacity until the timeslider kicks in.
    'line-dasharray': [
      'case',
      ['==', ['get', gapKey], 'time_gap'], // is gap in subpath, solid line
      ['literal', [2, 2]],
      ['literal', [1, 0]], // default
    ],
  },
  filter: ['==', '$type', 'LineString'],
};
```
