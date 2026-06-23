"use client";

import {
  GoogleMap,
  InfoWindow,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";

type NearbyPlace = {
    placeId: string;
    name: string;
    address: string;
    rating: number | null;
    userRatingCount: number;
    openNow: boolean | null;
    latitude: number | null;
    longitude: number | null;
    distance: number | null;
    photoName?: string | null;
    types?: string[];
  };

type Props = {
  center: {
    lat: number;
    lng: number;
  };
  places: NearbyPlace[];
  onSelectPlace: (place: NearbyPlace) => void;
  onSearchArea?: (center: { lat: number; lng: number }) => void;
};

const libraries: "places"[] = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getWalkMinutes(distance: number | null) {
  if (distance === null) return null;
  return Math.max(1, Math.ceil(distance / 80));
}

export default function NearbyMap({
  center,
  places,
  onSelectPlace,
  onSearchArea,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  useEffect(() => {
    setMapCenter(center);
  }, [center.lat, center.lng]);

  if (!apiKey) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-[28px] bg-red-50 p-6 text-center font-black text-red-600">
        ⚠️ 缺少 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY，請確認 .env.local 設定。
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-[28px] bg-red-50 p-6 text-center font-black text-red-600">
        ⚠️ Google 地圖載入失敗，請確認 Maps JavaScript API 是否已啟用。
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-[28px] bg-stone-100 font-black text-stone-500">
        地圖載入中...
      </div>
    );
  }

  function updateMapCenter() {
    if (!map) return;

    const nextCenter = map.getCenter();
    if (!nextCenter) return;

    setMapCenter({
      lat: nextCenter.lat(),
      lng: nextCenter.lng(),
    });

    setShowSearchArea(true);
  }

  function handleSearchThisArea() {
    if (!onSearchArea) return;

    setSelectedPlace(null);
    setShowSearchArea(false);
    onSearchArea(mapCenter);
  }

  function handleGooglePoiClick(placeId: string) {
    if (!map) return;

    const service = new google.maps.places.PlacesService(map);

    service.getDetails(
      {
        placeId,
        fields: [
          "place_id",
          "name",
          "formatted_address",
          "rating",
          "user_ratings_total",
          "geometry",
          "opening_hours",
        ],
      },
      (result, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !result) {
          return;
        }

        const lat = result.geometry?.location?.lat() ?? null;
        const lng = result.geometry?.location?.lng() ?? null;

        const nextPlace: NearbyPlace = {
            placeId: result.place_id || placeId,
            name: result.name || "未命名餐廳",
            address: result.formatted_address || "",
            rating: result.rating ?? null,
            userRatingCount: result.user_ratings_total ?? 0,
            openNow: result.opening_hours?.isOpen?.() ?? null,
            latitude: lat,
            longitude: lng,
            distance:
              lat !== null && lng !== null
                ? getDistanceMeters(center.lat, center.lng, lat, lng)
                : null,
            photoName: null,
            types: result.types || [],
          };

        setSelectedPlace(nextPlace);
        onSelectPlace(nextPlace);
      }
    );
  }

  function handleSelectMarker(place: NearbyPlace) {
    setSelectedPlace(place);
    onSelectPlace(place);
  }

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-[28px] bg-stone-100">
      {showSearchArea && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <button
            type="button"
            onClick={handleSearchThisArea}
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:scale-105"
          >
            🔎 搜尋此地圖區域
          </button>
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={16}
        onLoad={(mapInstance) => setMap(mapInstance)}
        onDragEnd={updateMapCenter}
        onZoomChanged={updateMapCenter}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: true,
        }}
        onClick={(e) => {
            const mapEvent = e as google.maps.MapMouseEvent & {
              placeId?: string;
            };
          
            if (mapEvent.placeId) {
              mapEvent.stop();
              handleGooglePoiClick(mapEvent.placeId);
            }
          }}
      >
        <Marker position={center} title="你的位置" />

        {places.map((place) => {
          if (place.latitude === null || place.longitude === null) return null;

          return (
            <Marker
              key={place.placeId}
              position={{
                lat: place.latitude,
                lng: place.longitude,
              }}
              title={place.name}
              onClick={() => handleSelectMarker(place)}
            />
          );
        })}

        {selectedPlace &&
          selectedPlace.latitude !== null &&
          selectedPlace.longitude !== null && (
            <InfoWindow
              position={{
                lat: selectedPlace.latitude,
                lng: selectedPlace.longitude,
              }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="min-w-[220px] max-w-[260px] p-1 text-stone-900">
                <div className="text-xs font-black text-orange-600">
                  🍔 地圖選取餐廳
                </div>

                <div className="mt-1 text-base font-black leading-6">
                  {selectedPlace.name}
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-orange-600">
                    ⭐ {selectedPlace.rating ?? "無評分"}
                  </span>

                  {selectedPlace.distance !== null && (
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">
                      📍 {selectedPlace.distance}m
                    </span>
                  )}

                  {getWalkMinutes(selectedPlace.distance) !== null && (
                    <span className="rounded-full bg-stone-100 px-2 py-1 text-stone-600">
                      🚶 約 {getWalkMinutes(selectedPlace.distance)} 分鐘
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPlace(selectedPlace);
                    window.location.href = `/restaurant/${selectedPlace.placeId}?source=nearby&distance=${selectedPlace.distance ?? 0}`;
                  }}
                  className="mt-3 w-full rounded-xl bg-stone-900 px-3 py-2 text-sm font-black text-white"
                >
                  查看避雷
                </button>
              </div>
            </InfoWindow>
          )}
      </GoogleMap>
    </div>
  );
}