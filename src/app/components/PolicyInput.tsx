"use client";
import React, { useState } from 'react';
import styles from '../styles/PolicyInput.module.scss';
import Reactions from './Reactions';
import DataInsights from './DataInsights';
import Reaction, { ReactionInterface } from './Reaction';
import personas from '@/app/policy_simulator/defaultPersonas';
import demoPolicy from '@/app/policy_simulator/demoPolicy';
import londonLocations from '@/app/policy_simulator/londonLocations';

const DEFAULT_POLICY = '';

const PolicyInput: React.FC = () => {
  const [policy, setPolicy] = useState(DEFAULT_POLICY);
  const [reactions, setReactions] = useState<ReactionInterface[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([
    personas[0]
  ]);
  const [selectedLocation, setSelectedLocation] = useState<string>('Greater London');
  const [dataInsights, setDataInsights] = useState<string>('');

  const handlePersonaSelect = (persona: string) => {
    setSelectedPersonas(prev => 
      prev.includes(persona) ? prev.filter(p => p !== persona) : [...prev, persona]
    );
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  const handleTryDemoPolicy = () => {
    setPolicy(demoPolicy);
  };

  const fetchDataInsights = async () => {
    try {
      const response = await fetch('/api/get_data_insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          policy,
          personas: selectedPersonas.map(persona => `${persona} (Lives in ${selectedLocation})`)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data insights');
      }

      const data = await response.json();
      setDataInsights(data.dataInsights);
      return data.dataInsights;
    } catch (err) {
      console.error('Error fetching data insights:', err);
      setError('Failed to fetch data insights. Please try again.');
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersonas.length === 0) {
      setError('Please select at least one persona.');
      return;
    }
    setIsLoading(true);
    setError('');
    setDataInsights('');
    setReactions(
      selectedPersonas.map(persona => ({ persona, response: '' }))
    );

    try {
      // Fetch data insights first
      const _dataInsights = await fetchDataInsights();

      // Then process each persona
      await Promise.all(selectedPersonas.map(async (persona, index) => {
        const personaWithLocation = `${persona} (Lives in ${selectedLocation})`;
        const response = await fetch('/api/simulate_policy_responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            policy,
            persona: personaWithLocation,
            dataInsights: _dataInsights
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to generate reaction');
        }
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader from response');
        }
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setReactions(prevReactions => {
            const newReactions = [...prevReactions];
            newReactions[index] = {
              ...newReactions[index],
              response: newReactions[index].response + chunk
            };
            return newReactions;
          });
        }
      }));
    } catch (err) {
      setError('Encountered an error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.policyInput}>
      <h4>Enter Policy Proposal</h4>
      <form onSubmit={handleSubmit}>
        <div className={styles.textareaContainer}>
          <textarea
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            placeholder="Enter your policy proposal here... (Max: 1000 characters)"
            rows={4}
            required
            maxLength={1000}
          />
          <button type="button" onClick={handleTryDemoPolicy} className={styles.demoButton}>
            Click here to fill with the demo policy
          </button>
        </div>
        <div className={styles.personaList}>
          <h5>Select Personas:</h5>
          <div className={styles.personaGrid}>
            {personas.map((persona, index) => (
              <label key={index} className={styles.personaItem}>
                <input
                  type="checkbox"
                  checked={selectedPersonas.includes(persona)}
                  onChange={() => handlePersonaSelect(persona)}
                />
                <span>{persona}</span>
              </label>
            ))}
          </div>
        </div>
        <div className={styles.locationPicker}>
          <h5>Select Location:</h5>
          <select value={selectedLocation} onChange={handleLocationChange}>
            {londonLocations.map((location, index) => (
              <option key={index} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={
          isLoading ||
          selectedPersonas.length === 0 ||
          !policy.trim()
        }>
          {isLoading ? 'Generating...' : 'Generate Reactions'}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {
        isLoading || dataInsights ?
          <DataInsights insights={dataInsights} />
          : null
      }
      <Reactions reactions={reactions} location={selectedLocation} />
    </div>
  );
};

export default PolicyInput;