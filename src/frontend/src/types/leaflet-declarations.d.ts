// Type declarations for Leaflet packages.

declare module "leaflet" {
  interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    [key: string]: unknown;
  }
  interface DivIcon {
    options: DivIconOptions;
  }
  interface IconDefaultPrototype {
    _getIconUrl?: unknown;
  }
  interface IconDefaultStatic {
    prototype: IconDefaultPrototype;
    mergeOptions(options: Record<string, unknown>): void;
  }
  export const Icon: { Default: IconDefaultStatic };
  export function divIcon(options?: DivIconOptions): DivIcon;
  export interface Marker {
    getLatLng(): { lat: number; lng: number };
  }
  const _default: { Icon: { Default: IconDefaultStatic } };
  export default _default;
}

declare module "leaflet/dist/leaflet.css" {
  const content: string;
  export default content;
}

declare module "leaflet/dist/images/marker-icon.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-icon-2x.png" {
  const src: string;
  export default src;
}

declare module "leaflet/dist/images/marker-shadow.png" {
  const src: string;
  export default src;
}

declare module "react-leaflet" {
  import type { ComponentType, ReactNode, Ref } from "react";
  interface MapContainerProps {
    center: [number, number];
    zoom: number;
    style?: React.CSSProperties;
    className?: string;
    children?: ReactNode;
    scrollWheelZoom?: boolean;
    [key: string]: unknown;
  }
  interface TileLayerProps {
    url: string;
    attribution?: string;
    [key: string]: unknown;
  }
  interface MarkerProps {
    position: [number, number];
    icon?: unknown;
    children?: ReactNode;
    draggable?: boolean;
    ref?: Ref<import("leaflet").Marker>;
    eventHandlers?: Record<string, (...args: any[]) => void>;
    [key: string]: unknown;
  }
  interface PopupProps {
    children?: ReactNode;
    [key: string]: unknown;
  }
  export const MapContainer: ComponentType<MapContainerProps>;
  export const TileLayer: ComponentType<TileLayerProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const Popup: ComponentType<PopupProps>;
  export function useMap(): unknown;
  export function useMapEvents(
    handlers: Record<string, (...args: any[]) => void>,
  ): unknown;
}

declare module "react-leaflet-cluster" {
  import type { ComponentType, ReactNode } from "react";
  interface MarkerClusterGroupProps {
    children?: ReactNode;
    [key: string]: unknown;
  }
  const MarkerClusterGroup: ComponentType<MarkerClusterGroupProps>;
  export default MarkerClusterGroup;
}
