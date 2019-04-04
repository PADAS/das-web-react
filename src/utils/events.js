export const displayTitleForEventByEventType = (event, eventTypes) => {
  if (event.title) return event.title;

  const matchingType = eventTypes.find(t => t.value === event.event_type);

  if (matchingType) return matchingType.display;
  if (event.event_type) return event.event_type;

  return 'Unknown event type';
}

export const getCoordinatesForEvent = evt => evt.geojson
  && evt.geojson.geometry
  && evt.geojson.geometry.coordinates;

export const eventHasLocation = (evt) => {
  if (evt.is_collection) {
    return evt.contains && evt.contains.some(contained => !!getCoordinatesForEvent(contained.related_event))
  }
  return !!evt.location;
}