export const displayTitleForEventByEventType = (event, eventTypes) => event.title || eventTypes.find(t => t.value === event.event_type).display;

export const getCoordinatesForEvent = evt => evt.geojson
  && evt.geojson.geometry
  && evt.geojson.geometry.coordinates;

export const eventHasLocation = (evt) => {
  if (evt.is_collection) {
    return evt.contains && evt.contains.some(contained => !!getCoordinatesForEvent(contained.related_event))
  }
  return !!evt.location;
}