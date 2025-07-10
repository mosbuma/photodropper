import ExifReader from 'exifreader'

// Extract EXIF data from file using exifreader
export const extractExifData = async (file: File): Promise<ExifReader.Tags> => {
  try {
    const tags = await ExifReader.load(file);
    return tags;
  } catch (err) {
    console.error('Error extracting EXIF:', err);
    return {} as ExifReader.Tags;
  }
}

// Lookup location name from lat/lng using Nominatim
export async function getLocationFromExif(exifData: ExifReader.Tags): Promise<string | null> {
  try {
    const lat = parseFloat(exifData.GPSLatitude?.description || '0')
    const lng = parseFloat(exifData.GPSLongitude?.description || '0')
    if (!lat && !lng) return null;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'photodropper/1.0 (your@email.com)' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const address = data.address;
    return (
      address.city || address.town || address.village || address.hamlet || address.county || address.state || data.display_name || null
    );
  } catch (err) {
    console.error('Error in getLocationFromLatLng:', err);
    return null;
  }
}

// Utility for comment display throttling
const COMMENT_SHOWN_KEY = 'photodropper_comment_last_shown';
const COMMENT_MIN_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export function canShowComment(commentId: string): boolean {
  if (typeof window === 'undefined') return true;
  const raw = localStorage.getItem(COMMENT_SHOWN_KEY);
  let stats: Record<string, number> = {};
  if (raw) {
    try { stats = JSON.parse(raw); } catch {}
  }
  const now = Date.now();
  const last = stats[commentId] || 0;
  return now - last > COMMENT_MIN_INTERVAL_MS;
}

export function markCommentShown(commentId: string) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(COMMENT_SHOWN_KEY);
  let stats: Record<string, number> = {};
  if (raw) {
    try { stats = JSON.parse(raw); } catch {}
  }
  stats[commentId] = Date.now();
  localStorage.setItem(COMMENT_SHOWN_KEY, JSON.stringify(stats));
} 