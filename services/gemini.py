import os
import json
import logging
from flask import current_app
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Fallback recommendations database
FALLBACK_TIPS = {
    'transportation': [
        {
            'title': 'Transition to Active Transport',
            'impact': 'High',
            'description': 'Walk, run, or cycle for short journeys (under 2 miles). This eliminates vehicle emissions entirely and improves health.'
        },
        {
            'title': 'Optimize Vehicle Usage & Maintenance',
            'impact': 'Medium',
            'description': 'Keep tires properly inflated, combine errands into single trips, and remove excess weight to boost fuel efficiency.'
        },
        {
            'title': 'Utilize Public Transit or Carpooling',
            'impact': 'High',
            'description': 'Shift from single-occupancy vehicle trips to buses, trains, or carpools, which divides carbon impact among passengers.'
        }
    ],
    'energy': [
        {
            'title': 'Upgrade to Smart/LED Lighting',
            'impact': 'High',
            'description': 'Replace incandescent bulbs with LEDs, which use up to 75% less energy and last up to 25 times longer.'
        },
        {
            'title': 'Eliminate Phantom Load Draw',
            'impact': 'Medium',
            'description': 'Unplug appliances, chargers, and electronics when not in use, or use smart power strips to cut standby power waste.'
        },
        {
            'title': 'Adjust Climate Control Benchmarks',
            'impact': 'High',
            'description': 'Set thermostats to 68°F (20°C) in winter and 78°F (26°C) in summer to reduce heating and cooling energy demands.'
        }
    ],
    'waste': [
        {
            'title': 'Adopt Organic Waste Composting',
            'impact': 'High',
            'description': 'Divert food scraps and yard waste from landfills where they decompose anaerobically to produce harmful methane gas.'
        },
        {
            'title': 'Reject Single-Use Packaging',
            'impact': 'Medium',
            'description': 'Switch to reusable water bottles, grocery bags, and food containers to reduce landfill volumes and manufacturing footprints.'
        },
        {
            'title': 'Practice Clean Recycling Habits',
            'impact': 'Medium',
            'description': 'Clean items before recycling and avoid "wishcycling" non-recyclables to ensure recycling streams remain uncontaminated.'
        }
    ],
    'diet': [
        {
            'title': 'Embrace Plant-Forward Eating',
            'impact': 'High',
            'description': 'Substitute red meat and dairy with plant-based proteins (beans, lentils, tofu) to dramatically reduce agricultural emissions.'
        },
        {
            'title': 'Minimize Domestic Food Waste',
            'impact': 'High',
            'description': 'Plan meals ahead, store groceries correctly to extend shelf life, and utilize leftovers before they spoil.'
        },
        {
            'title': 'Source Local, Seasonal Produce',
            'impact': 'Medium',
            'description': 'Buy food grown locally and in-season to minimize long-distance transportation emissions ("food miles").'
        }
    ]
}

def get_recommendations_for_user(highest_category, values_summary):
    """
    Tries to retrieve recommendations from Google Gemini.
    Falls back to localized rules-based recommendations on failure or missing API key.
    """
    api_key = current_app.config.get('GEMINI_API_KEY')
    
    if not api_key:
        logger.info("Gemini API key not found. Using local rule-based fallback.")
        return {
            'source': 'Fallback Rule Engine',
            'category': highest_category,
            'recommendations': FALLBACK_TIPS.get(highest_category, FALLBACK_TIPS['energy'])
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = (
            f"Provide exactly 3 actionable carbon footprint reduction recommendations for an individual "
            f"whose highest emission category is '{highest_category}'. Current stats (kg CO2): {values_summary}. "
            f"Return the response strictly as a JSON list of objects containing keys 'title', 'impact' "
            f"(High, Medium, or Low), and 'description'. Do not output markdown, html, or additional text."
        )
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean potential markdown wrapping
        if text.startswith("```json"):
            text = text.split("```json", 1)[1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()
        
        recommendations = json.loads(text)
        if isinstance(recommendations, list) and len(recommendations) > 0:
            return {
                'source': 'Gemini AI',
                'category': highest_category,
                'recommendations': recommendations
            }
        raise ValueError("Invalid recommendation structure returned by AI.")
        
    except Exception as e:
        logger.error(f"Error invoking Gemini API: {str(e)}. Falling back to localized rule engine.")
        return {
            'source': 'Fallback Rule Engine',
            'category': highest_category,
            'recommendations': FALLBACK_TIPS.get(highest_category, FALLBACK_TIPS['energy'])
        }
