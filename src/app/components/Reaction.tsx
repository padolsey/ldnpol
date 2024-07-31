"use client";
import React from 'react';
import styles from '../styles/Reaction.module.scss';
import TypedMessage from './TypedMessage';

const LOADING_CHARACTER = '\uE081';

export interface ReactionInterface {
  persona: string;
  response: string;
}

const Reaction: React.FC<ReactionInterface> = ({
  persona = '',
  response = ''
}) => {
  const dataInsights = response.match(
    /<dataInsights>(?:<data_insights>)?([\s\S]+?)(?:<\/data_insights>)?<\/dataInsights>/i
  )?.[1];

  response = response.replace(/<dataInsights>[\s\S]+?<\/dataInsights>/ig, '');
  response = response.replace(RegExp(LOADING_CHARACTER, 'g'), '').trim();
  
  const isLoading = !response;

  return (
    <div className={styles.reaction}>
      <h5 className={styles.persona}>{persona}:</h5>
      <div className={styles.response}>
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <div className={styles.loadingText}>Loading...</div>
            <div className={styles.progressBar}>
              <div className={styles.progressBarFill}></div>
            </div>
          </div>
        )}
        {!isLoading && (
          <>
            <div className={styles.statement}>
              <TypedMessage message={response} isStreaming={true} />
            </div>
            <div className={styles.insights}>
              {dataInsights && (
                <>
                  <strong>Unconfirmed indications from the available data</strong>: {dataInsights}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reaction;