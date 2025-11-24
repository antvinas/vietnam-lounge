export function searchAutocomplete(
  input: string,
  session: google.maps.places.AutocompleteSessionToken
): Promise<google.maps.places.AutocompletePrediction[]> {
  return new Promise((resolve) => {
    const svc = new google.maps.places.AutocompleteService();
    svc.getPlacePredictions({ input, sessionToken: session }, (preds, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && preds) resolve(preds);
      else resolve([]);
    });
  });
}

export function getPlaceDetails(placeId: string): Promise<{ name: string; lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    const svc = new google.maps.places.PlacesService(document.createElement("div"));
    svc.getDetails({ placeId, fields: ["name", "geometry.location"] }, (p, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && p?.geometry?.location) {
        const { lat, lng } = p.geometry.location.toJSON();
        resolve({ name: p.name ?? "", lat, lng });
      } else reject(status);
    });
  });
}
