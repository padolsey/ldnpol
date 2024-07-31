"use client";
import React from 'react';
import styles from '../styles/DataInsights.module.scss';
import ReactMarkdown from 'react-markdown';

export interface DataInsightsInterface {
  insights: string;
}

const DataInsights: React.FC<DataInsightsInterface> = ({
  insights = ''
}) => {

  return (
    <div className={styles.insights}>
      <h5>Relevant data insights:</h5>
      {!insights && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>Loading...</div>
          <div className={styles.progressBar}>
            <div className={styles.progressBarFill}></div>
          </div>
        </div>
      )}
      {insights && (
        <div className={styles.content}>
          <ReactMarkdown>{insights}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default DataInsights;