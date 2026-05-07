import React from 'react';

interface DentalChartDisplayProps {
  permanentTeethStatus: any;
  temporaryTeethStatus: any;
}

const DentalChartDisplay: React.FC<DentalChartDisplayProps> = ({ 
  permanentTeethStatus = {}, 
  temporaryTeethStatus = {} 
}) => {
  const healthyFill = '#e5e7eb';
  const healthyStroke = '#6b7280';

  const getToothStatus = (toothNumber: number) => {
    const pStatus = permanentTeethStatus || {};
    const tStatus = temporaryTeethStatus || {};
    return pStatus[toothNumber] || tStatus[toothNumber] || {};
  };

  const getToothColor = (toothNumber: number) => {
    const status = getToothStatus(toothNumber);
    if (status.status === 'Missing') return '#374151'; // Dark gray for missing
    if (status.status === 'Decayed') return '#b91c1c'; // Deep red for decayed
    if (status.status === 'Filled') return '#059669'; // Emerald green for filled
    if (status.status === 'Extracted') return '#dc2626'; // Bright red for extracted
    if (status.status === 'Needs Extraction') return '#ea580c'; // Orange-red for needs extraction
    if (status.status === 'Needs Filling') return '#ca8a04'; // Gold yellow for needs filling
    if (status.status === 'Treated') return '#16a34a'; // Forest green for treated
    if (status.treatment || status.status) return '#2563eb'; // Blue for any other data
    return healthyFill; // Light gray for healthy/no data
  };

  const toothCoords: Record<number, string> = {
    1: "210,251,215,273,213,289,192,302,169,284,165,265,167,254,178,244,182,248,191,243,203,249",
    2: "209,210,205,238,206,196,187,196,169,195,158,211,159,226,162,241,202,245",
    3: "203,194,177,194,164,180,167,156,186,155,212,169,208,185",
    4: "196,119,215,123,215,136,209,156,169,152,173,125,184,114",
    5: "205,84,224,91,222,104,210,121,190,110,184,91,196,80",
    6: "216,53,235,57,236,70,236,87,218,81,203,74,200,59",
    7: "250,30,260,40,259,53,258,70,245,70,227,49,225,37",
    8: "294,20,295,43,279,64,259,35,267,21",
    9: "313,21,341,27,332,42,320,59,305,54,303,41,301,23",
    10: "366,40,374,51,366,56,357,69,343,74,340,59,340,44,349,33",
    11: "386,86,375,87,358,84,363,74,367,60,387,55,398,65,388,76",
    12: "398,79,412,100,404,114,386,117,377,108,377,88",
    13: "402,161,384,154,381,138,387,121,416,116,423,131,425,150",
    14: "429,163,430,190,414,198,389,195,384,179,387,165,407,162",
    15: "389,220,389,230,394,242,410,249,419,244,436,236,438,219,435,209,425,201,394,200",
    16: "391,249,383,274,388,295,401,303,423,294,426,273,423,253",
    17: "415,352,425,360,431,379,431,395,411,403,391,394,390,373,389,361,403,348",
    18: "434,405,442,416,443,439,432,451,415,450,398,443,393,425,400,403",
    19: "409,493,428,491,436,481,436,465,428,452,398,453,392,468,392,485",
    20: "394,525,408,532,422,532,425,516,433,504,418,495,397,490,387,497,385,515",
    21: "382,534,376,551,385,564,402,567,413,558,413,539,394,531",
    22: "372,558,364,570,368,583,378,593,396,594,400,584,396,568",
    23: "348,575,340,589,342,603,347,616,361,614,380,606,375,587",
    24: "317,584,309,598,306,611,308,626,324,626,342,623,336,598",
    25: "285,587,277,594,272,604,263,619,271,627,286,629,305,628,298,601",
    26: "264,617,266,589,254,576,246,584,234,590,226,611,249,618,267,618",
    27: "219,565,206,576,205,592,215,598,236,590,244,573,242,561,238,561",
    28: "203,534,194,541,193,561,210,569,230,556,223,535",
    29: "188,495,180,502,176,515,187,536,203,533,223,525,214,493,201,495",
    30: "176,459,197,454,211,457,216,485,188,498,174,488,170,469",
    31: "187,409,214,409,207,453,171,452,162,432,171,407",
    32: "202,351,224,363,217,390,206,405,182,404,167,389,182,356"
  };

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-lg shadow-inner">
      <div className="relative inline-block w-full max-w-[500px]">
        <svg 
          viewBox="0 0 600 651"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <image xlinkHref="/wholeset.svg" width="600" height="651" />
          {Object.entries(toothCoords).map(([toothNum, coords]) => {
            const toothNumber = parseInt(toothNum);
            const color = getToothColor(toothNumber);
            const status = getToothStatus(toothNumber);
            const stroke = color === healthyFill ? healthyStroke : color;
            return (
              <polygon
                key={toothNumber}
                points={coords}
                fill={color}
                fillOpacity="1.0"
                stroke={stroke}
                strokeWidth="1"
              >
                <title>{`Tooth ${toothNumber}: ${status.status || 'Healthy'}${status.treatment ? `\nTreatment: ${status.treatment}` : ''}`}</title>
              </polygon>
            );
          })}
        </svg>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{ backgroundColor: healthyFill, border: `1px solid ${healthyStroke}` }}></div>
          <span>Healthy</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#b91c1c'}}></div>
          <span>Decayed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#059669'}}></div>
          <span>Filled</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#374151'}}></div>
          <span>Missing</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#dc2626'}}></div>
          <span>Extracted</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#ea580c'}}></div>
          <span>Needs Ext.</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#ca8a04'}}></div>
          <span>Needs Fill.</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3" style={{backgroundColor: '#2563eb'}}></div>
          <span>Other Data</span>
        </div>
      </div>
    </div>
  );
};

export default DentalChartDisplay;
