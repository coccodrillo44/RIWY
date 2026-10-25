const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
const BITS = [16, 8, 4, 2, 1];

/** Stessa codifica di GeoHashUtils.encode dell'app Android (precisione 8). */
export function geohashEncode(lat: number, lng: number, precision = 8): string {
  let latS = -90, latE = 90, lngS = -180, lngE = 180;
  let hash = "";
  let even = true;
  let bit = 0;
  let ch = 0;
  while (hash.length < precision) {
    if (even) {
      const mid = (lngS + lngE) / 2;
      if (lng >= mid) { ch |= BITS[bit]; lngS = mid; } else { lngE = mid; }
    } else {
      const mid = (latS + latE) / 2;
      if (lat >= mid) { ch |= BITS[bit]; latS = mid; } else { latE = mid; }
    }
    even = !even;
    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }
  return hash;
}
