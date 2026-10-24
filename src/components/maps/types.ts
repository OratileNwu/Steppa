export type MapCoordinate = [number, number];

export type MapLocation = {
  label: string;
  coordinates: MapCoordinate;
};

export type ConfirmedRoute = {
  collection: MapLocation;
  destination: MapLocation | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
};

export type SteppaMapProps = {
  category?: string;
  initialCollection?: string;
  initialDestination?: string;
  queueOnly?: boolean;
  onConfirm?: (route: ConfirmedRoute) => void;
};
