import React from 'react';
import styles from '../styles/Reactions.module.scss';
import Reaction from './Reaction';

interface ReactionsProps {
  reactions: Array<{ persona: string; response: string }>;
  location: string;
}

const Reactions: React.FC<ReactionsProps> = ({
  reactions = [],
  location = ''
}) => {
  return (
    <div className={styles.reactions}>
      <h2>Constituent Reactions{location ? ' in ' + location : ''}</h2>
      {reactions.length === 0 ? (
        <p>No reactions generated yet. Enter a policy proposal to see reactions.</p>
      ) : (
        <ul className={styles.reactionList}>
          {reactions.map((reaction, index) => (
            <li key={index}>
              <Reaction
                persona={reaction.persona}
                response={reaction.response}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Reactions;