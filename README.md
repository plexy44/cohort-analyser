# Cohort Analyser (CohortSuite)

A powerful, client-side analytics dashboard designed to visualize and analyze **Google Analytics 4 (GA4) Cohort Exports**.

Built with **React**, **Vite**, and **Tailwind CSS**, this tool processes raw CSV exports locally in your browser to generate interactive LTV curves, retention heatmaps, and purchase velocity trends without sending data to any server.

![App Screenshot](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop) **

## 🚀 Features

### 1. Data Ingestion (ETL)
* **Drag & Drop Parsing:** Instantly parses raw GA4 Cohort CSV exports.
* **Auto-Cleaning:** Automatically removes header metadata, calculates percentages, and standardizes date formats.
* **Privacy First:** All processing happens in the browser. No data is uploaded to the cloud.

### 2. Cohort Explorer
* **LTV Curves:** Visualize cumulative value generation over time using interactive Area charts.
* **Incremental Growth:** Switch to Bar charts to see month-over-month performance.
* **Performance Grid:** A heatmap-style table showing retention rates and volume per cohort month.

### 3. Velocity Explorer
* **Purchase Velocity:** Track "Purchases Per Day" trends to identify peak performance periods.
* **Path Analysis:** Drill down into specific page paths (entry points) to see which landing pages drive the highest LTV.
* **Traffic vs. Value:** Overlay visitor volume against purchase counts to spot efficiency gaps.

## 🛠️ Tech Stack

* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Glassmorphism UI)
* **Charts:** Recharts
* **Icons:** Lucide React
* **Utilities:** Lodash

## 💻 Getting Started

### Prerequisites
* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    
    ```bash
    git clone [https://github.com/plexy44/cohort-analyser.git](https://github.com/plexy44/cohort-analyser.git)
    cd cohort-analyser
    ```

2.  **Install dependencies**
    
    ```bash
    npm install
    ```

3.  **Run the development server**
    
    ```bash
    npm run dev
    ```

## 🚀 Deployment

This project is optimised for deployment on **Netlify** or **Vercel**.

**Build Command:**

```bash
npm run build
