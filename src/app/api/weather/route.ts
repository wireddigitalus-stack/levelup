import { NextRequest, NextResponse } from "next/server";

// Density Altitude calculation
function calcDensityAltitude(tempF: number, pressureHpa: number, humidity: number, elevationFt: number): number {
  const tempC = (tempF - 32) * 5 / 9;
  // Saturation vapor pressure (Magnus formula)
  const es = 6.1078 * Math.pow(10, (7.5 * tempC) / (237.3 + tempC));
  const actualVaporPressure = es * (humidity / 100);
  // Station pressure in hPa adjusted for moisture
  const dryPressure = pressureHpa - (0.3783 * actualVaporPressure);
  // Virtual temperature in Kelvin
  const tvK = (tempC + 273.15) / (1 - (0.3783 * actualVaporPressure / pressureHpa));
  // Pressure altitude
  const pressureAlt = (1 - Math.pow(pressureHpa / 1013.25, 0.190284)) * 145366.45;
  // Density altitude
  const stationDA = pressureAlt + (120 * (tempC - (15 - (0.001981 * elevationFt * 0.3048) * 1000))); 
  // Simplified Koch method
  const da = Math.round(elevationFt + (120 * (tempF - 59)) + (28 * (30.00 - (pressureHpa * 0.02953))));
  return da;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat and lon required" }, { status: 400 });
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey) {
      // Return mock data if no API key configured
      const mockTemp = 72;
      const mockPressure = 1015;
      const mockHumidity = 45;
      const mockElevation = 1800;
      return NextResponse.json({
        data: {
          temp: mockTemp,
          feelsLike: 70,
          humidity: mockHumidity,
          windSpeed: 6,
          windDeg: 270,
          windDirection: "W",
          pressure: mockPressure,
          condition: "Partly Cloudy",
          icon: "02d",
          elevation: mockElevation,
          densityAltitude: calcDensityAltitude(mockTemp, mockPressure, mockHumidity, mockElevation),
          location: "Range (Demo)",
          source: "mock",
        },
      });
    }

    // Real OpenWeatherMap call
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );

    if (!weatherRes.ok) {
      return NextResponse.json(
        { error: `Weather API error: ${weatherRes.status}` },
        { status: weatherRes.status }
      );
    }

    const w = await weatherRes.json();

    const tempF = Math.round(w.main.temp);
    const pressureHpa = w.main.pressure;
    const humidity = w.main.humidity;
    // Rough elevation from pressure (sea level standard)
    const elevationFt = Math.round((1 - Math.pow(pressureHpa / 1013.25, 0.190284)) * 145366.45);

    // Wind direction degrees to compass
    const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    const windDir = dirs[Math.round((w.wind?.deg || 0) / 22.5) % 16];

    // Wind degrees to clock face
    const windDeg = w.wind?.deg || 0;

    const da = calcDensityAltitude(tempF, pressureHpa, humidity, elevationFt);

    return NextResponse.json({
      data: {
        temp: tempF,
        feelsLike: Math.round(w.main.feels_like),
        humidity,
        windSpeed: Math.round(w.wind?.speed || 0),
        windDeg,
        windDirection: windDir,
        pressure: pressureHpa,
        condition: w.weather?.[0]?.description || "Unknown",
        icon: w.weather?.[0]?.icon || "01d",
        elevation: elevationFt,
        densityAltitude: da,
        location: w.name || "Unknown",
        source: "openweathermap",
      },
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
