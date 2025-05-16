import { WorldView, ChartData } from "@shared/schema";

const CHART_COLORS = {
  backgroundColor: [
    'rgba(200, 190, 240, 0.5)',
    'rgba(255, 205, 130, 0.5)',
    'rgba(120, 220, 170, 0.5)',
    'rgba(240, 150, 150, 0.5)',
  ],
  borderColor: [
    'rgba(170, 150, 220, 1)',
    'rgba(235, 175, 90, 1)',
    'rgba(80, 190, 140, 1)',
    'rgba(220, 110, 110, 1)',
  ]
};

export const DEFAULT_METRICS = [
  'Monotheism',
  'Sacred Texts Authority',
  'Afterlife Beliefs',
  'Moral Absolutes'
];

// Generates default chart data for when AI response fails or is incorrect
export function generateDefaultChartData(): ChartData {
  const labels = Object.values(WorldView).map(wv => wv.charAt(0).toUpperCase() + wv.slice(1));
  
  // Create data with meaningful patterns for each worldview
  const datasets = DEFAULT_METRICS.map((metric, index) => {
    // Generate data that shows patterns of similarity between related religions
    let data: number[] = [];
    
    // Generate data that reflects common theological positions
    switch(metric) {
      case 'Monotheism':
        data = [
          15,  // atheism - rejects deity concepts
          30,  // agnosticism - uncertain about deities
          95,  // christianity - strong monotheism
          98,  // islam - strict monotheism
          70,  // hinduism - complex view, often seen as monotheistic with manifestations
          40,  // buddhism - generally non-theistic
          95,  // judaism - strict monotheism
          90   // sikhism - monotheistic
        ];
        break;
      case 'Sacred Texts Authority':
        data = [
          10,  // atheism - rejects religious texts as authorities
          25,  // agnosticism - skeptical of religious texts
          90,  // christianity - bible as central authority
          95,  // islam - quran as divine revelation
          85,  // hinduism - vedas and other texts
          80,  // buddhism - sutras and other texts
          95,  // judaism - torah and talmud
          90   // sikhism - guru granth sahib
        ];
        break;
      case 'Afterlife Beliefs':
        data = [
          10,  // atheism - typically no afterlife belief
          40,  // agnosticism - uncertain about afterlife
          95,  // christianity - heaven/hell
          95,  // islam - paradise/hell
          90,  // hinduism - reincarnation/moksha
          90,  // buddhism - rebirth/nirvana
          85,  // judaism - complex, evolving views
          85   // sikhism - cycle of rebirth until union with God
        ];
        break;
      case 'Moral Absolutes':
        data = [
          60,  // atheism - moral systems without religious basis
          50,  // agnosticism - varies widely
          90,  // christianity - God-given moral laws
          95,  // islam - divine moral commandments
          85,  // hinduism - dharma as moral framework
          80,  // buddhism - ethical precepts
          90,  // judaism - divine commandments and laws
          85   // sikhism - ethical living guided by gurus
        ];
        break;
      default:
        // Random data as fallback
        data = labels.map(() => Math.floor(Math.random() * 100));
    }
    
    return {
      label: metric,
      data,
      backgroundColor: CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length],
      borderColor: CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length],
      borderWidth: 1
    };
  });
  
  return {
    labels,
    datasets
  };
}

// Helper function to sanitize chart data from AI
export function sanitizeChartData(chartJson: any): ChartData {
  try {
    // Check if we have valid data structure
    if (!chartJson || !chartJson.metrics || !chartJson.scores || 
        !Array.isArray(chartJson.metrics) || typeof chartJson.scores !== 'object') {
      console.log("Invalid chart data structure, using default data");
      return generateDefaultChartData();
    }
    
    // Check if metrics array has content
    if (chartJson.metrics.length === 0) {
      console.log("Empty metrics array, using default data");
      return generateDefaultChartData();
    }
    
    // Get metrics and ensure we have exactly 4
    const metrics = chartJson.metrics.slice(0, 4);
    while (metrics.length < 4) {
      metrics.push(DEFAULT_METRICS[metrics.length]);
    }
    
    // Prepare scores with validation
    const labels = Object.values(WorldView);
    const labelNames = labels.map(wv => wv.charAt(0).toUpperCase() + wv.slice(1));
    
    // Create datasets with validation
    const datasets = metrics.map((metric: string, index: number) => {
      // Get data for this metric across all worldviews
      const data = labels.map(worldview => {
        const wv = worldview.toString().toLowerCase();
        
        // Check if this worldview has scores
        if (!chartJson.scores[wv] || !Array.isArray(chartJson.scores[wv])) {
          // Try alternative case formats
          const altKey = wv.charAt(0).toUpperCase() + wv.slice(1);
          if (!chartJson.scores[altKey] || !Array.isArray(chartJson.scores[altKey])) {
            return getDefaultValueForMetricAndWorldview(metric, wv);
          }
          
          // Use alternative case format
          return validScoreValue(chartJson.scores[altKey][index]);
        }
        
        // Use the score at this index, or default
        return validScoreValue(chartJson.scores[wv][index]);
      });
      
      return {
        label: metric,
        data,
        backgroundColor: CHART_COLORS.backgroundColor[index % CHART_COLORS.backgroundColor.length],
        borderColor: CHART_COLORS.borderColor[index % CHART_COLORS.borderColor.length],
        borderWidth: 1
      };
    });
    
    return {
      labels: labelNames,
      datasets
    };
  } catch (error) {
    console.error("Error sanitizing chart data:", error);
    return generateDefaultChartData();
  }
}

// Helper to ensure a valid score value
function validScoreValue(value: any): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return 50; // Default middle value
  }
  return Math.max(0, Math.min(100, Math.round(value))); // Ensure 0-100 range
}

// Get meaningful default values based on worldview and metric
function getDefaultValueForMetricAndWorldview(metric: string, worldview: string): number {
  const defaultData = generateDefaultChartData();
  const metricIndex = DEFAULT_METRICS.findIndex(m => 
    m.toLowerCase() === metric.toLowerCase());
  const worldviewIndex = Object.values(WorldView).findIndex(wv => 
    wv.toString().toLowerCase() === worldview.toLowerCase());
  
  if (metricIndex >= 0 && worldviewIndex >= 0) {
    return defaultData.datasets[metricIndex].data[worldviewIndex];
  }
  
  return 50; // Default middle value
}