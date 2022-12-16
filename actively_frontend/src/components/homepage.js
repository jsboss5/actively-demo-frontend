import React from 'react';
import ReactDOM from 'react-dom/client';
import  '../style/homepage.scss';
import DataChart from './datachart';

export default function HomePage() {
    return (
     <div className="homepage-container"> 
        <div className="header-container">
            Train Your Own Model
        </div>

        <DataChart/>
     </div>


    );
  }
  

  