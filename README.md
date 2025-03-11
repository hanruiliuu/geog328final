# **Visualizing Public Transport Accessibility in Seattle**  

## **Group Members**  
- Rizkika Ramadhanti  
- Emina Garcia  
- Adam Sebhat  
- Han Rui Liu  

## **Project Overview**  
Seattle’s public transit system is essential for residents commuting to jobs, education, and healthcare. However, public transit accessibility varies across different neighborhoods, with some areas facing insufficient public transportation access.  

With this project we developed an **interactive Web GIS application** to visualize public transport accessibility in King County. Our web-based tool integrates transit stop data and demographic overlays to highlight areas with. Users can interact with the map to explore transit gaps, identify patterns in accessibility, and support data-driven transportation planning. This project aims to assist **city planners, researchers, and advocacy groups** in improving transit equity across Seattle.  

📍 **Live Web Application:** [https://github.com/hanruiliuu/geog328final.git]  

## **Project Goals**  
- **Map public transit stops** in King County and analyze differences in accessibility.  
- **Show disparities in transit service coverage** using interactive layers.  
- **Provide a user-friendly interface** for exploring transit accessibility.  
- **Support data-driven decision-making** for equitable transportation planning.  
- **Encourage public advocacy** for better public transit infrastructure.  

## **Data Sources**  
We used multiple datasets from **King County GIS Open Data** to build our Web GIS application. Each dataset was cleaned and processed before use.  

- **[King County Transit Stops Dataset](https://gis-kingcounty.opendata.arcgis.com/datasets/kingcounty::transit-stops-for-king-county-metro-transitstop-point/explore)** – Contains transit stop locations for buses, light rail, and ferries.  
- **[King County Transit Routes](https://gis-kingcounty.opendata.arcgis.com/)** – Shows public transit routes across Seattle.  
- **[King County Median Household Income](https://gis-kingcounty.opendata.arcgis.com/)** – Contains income data at the neighborhood level for demographic analysis.  

### **Cleaned Datasets in the Assets Folder**  
| File Name | Description |
|-----------|------------|
| **Cleaned_Transit_Stops.geojson** | Cleaned dataset of transit stops in Seattle, keeping only active stops with accessibility information. |
| **Cleaned_Transit_Routes.geojson** | Cleaned transit route data, showing paths for bus, rail, and ferry services. |
| **Cleaned_Median_Household_Income.geojson** | Cleaned income data for King County neighborhoods, used for demographic analysis. |

### **Key Data Attributes**  
- **STOP_ID** – Unique identifier for each transit stop.  
- **STOP_STATUS** – Shows if a stop is active (`ACT`), closed (`CLO`), or inactive (`INA`).  
- **ACCESSIBILITY_DECAL** – Indicates if the stop is ADA-accessible (e.g., ramps, tactile paving).  
- **geometry** – Contains latitude/longitude coordinates for mapping.  

## **Data Cleaning Process**  
We processed the dataset using assistance from AI to improve usability and performance:  

1. **Filtered relevant data** – Retained only `STOP_ID`, `STOP_STATUS`, `ACCESSIBILITY_DECAL`, and `geometry`.  
2. **Standardized coordinate system** – Converted all spatial data to **WGS 84 (EPSG:4326)** for web compatibility.  
3. **Removed closed/inactive stops** – Dropped `"CLO"` (Closed) and `"INA"` (Inactive) stops, reducing the dataset from **44,535 to 22,355 active stops**.  
4. **Handled missing data** – Removed records missing `STOP_ID` or `geometry`.  
5. **Exported cleaned data** – Saved as **GeoJSON** (for web mapping) and **Shapefile** (for GIS analysis).  

## **Application Features & Functions**  

### 🔹 **Main Features**  
**Interactive Map** – Users can toggle transit stops, accessibility zones, and demographic overlays.  
**Transit Accessibility Heatmaps** – Highlights neighborhoods with strong or weak transit service.  
**Filterable Transit Modes** – Users can switch between bus, light rail, or ferry stops.  
**Custom Basemap** – Styled in **Mapbox Studio** for clarity and readability.  
**Legend & Info Panel** – Provides explanations for data layers and color-coded accessibility zones.  

### 🔹 **Technical Aspects**  
- **Base Map & Thematic Layers** – Custom **Mapbox basemaps** overlayed with public transit accessibility layers.  
- **Data Hosting** – The cleaned **GeoJSON datasets are hosted on GitHub** for easy integration.  
- **JavaScript & Libraries** – Built with **Mapbox GL JS, Turf.js, and Leaflet.js** for advanced spatial functions.  
- **Sorting & Filtering** – Users can sort transit stops by mode or accessibility level.  

## **Favicon**  
We created a **custom favicon** for our Web GIS application to enhance user experience. This icon represents **King County's public transit system**, ensuring our webpage has a visually distinct and professional look. The favicon was designed using **[Insert Tool Name]** and is stored in the `/assets` folder.  

## **Project Management on GitHub**  
Our repository is structured as follows:  

/assets → Icons, images, and cleaned datasets (GeoJSON files)
/scripts → JavaScript files for interactive functions
/styles → CSS stylesheets for UI customization


### **GitHub Best Practices Used**  
✅ **Organized Repository** – Clear folder structure and well-commented code.  
✅ **GitHub Issues** – Used for tracking tasks, feature requests, and bug fixes.  
✅ **Version Control** – All commits are documented for transparency.  

## **Applied Libraries & Technologies**  
| Technology       | Purpose |
|-----------------|---------|
| **Mapbox GL JS** | Interactive web mapping & visualization |
| **Turf.js** | Spatial analysis (e.g., buffer zones, distance calculations) |
| **Leaflet.js** | Additional map layer support |
| **D3.js** | Data-driven visualizations |
| **GitHub Pages** | Web application hosting |
| **GeoJSON & Shapefiles** | Processed transit stop data |

## **AI Use Disclosure**  
We used **ChatGPT** for:  
- Assistance in cleaning datasets to optimize accuracy and map visual.  
- Generating boilerplate code for basic mapping functions.  
- Fixing small CSS styling issues.  
- Structuring README file (We did not use AI to write our descriptions only for structure)

We **did NOT** use AI to write the project description, README, or web page content.  

## **Challenges & Future Improvements**  
🔹 **Challenges**  
- **Large dataset processing** – Filtering and cleaning over **44,000 transit stops** took time.  
- **Performance optimization** – Ensuring smooth webpage rendering for large datasets used.  

🔹 **Future Improvements**  
- We can work on integrating **real-time transit data**.  
- We can add **user feedback tools** for transit stops.  
- We can improve **mobile/webpage responsiveness** for better user experience.  

## **Acknowledgments**  
We extend our thanks to:  
- **Professor Bo Zhao** and the **GEOG 328 teaching team** for guidance throughout this project.  
- **King County GIS Open Data** for providing the public with up to date transit data.  
- **Our peers** for valuable feedback during project development.  

---

🔗 **GitHub Repository:** [https://github.com/hanruiliuu/geog328final.git]  
📍 **Live Web App:** [Insert Live URL Here]  



