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