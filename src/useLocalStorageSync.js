import { useState, useEffect } from 'react';

// keyName: the unique string for LocalStorage (e.g., 'notesData', 'habitData')
// cloudData: the incoming data from your backend/props
export const useLocalStorageSync = (keyName, cloudData = []) => {
  const [data, setData] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Load from LocalStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(keyName);
      if (savedData) {
        setData(JSON.parse(savedData));
      } else if (cloudData && cloudData.length > 0) {
        setData(cloudData);
      }
    } catch (e) {
      console.error(`Failed to load ${keyName} from local storage`, e);
    }
    setIsLoaded(true);
  }, [keyName]); // Added keyName so it knows which storage item to grab

  // 2. Save to LocalStorage whenever data changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(keyName, JSON.stringify(data));
    }
  }, [data, isLoaded, keyName]);

  // 3. Intelligently merge incoming cloud data
  useEffect(() => {
    if (isLoaded && cloudData && cloudData.length > 0) {
      setData(prevData => {
        const mergedData = [...prevData];
        let hasNewData = false;
        
        cloudData.forEach(incomingItem => {
          // Checks if the item already exists by ID
          if (!mergedData.some(item => item.id === incomingItem.id)) {
            mergedData.push(incomingItem);
            hasNewData = true;
          }
        });
        
        return hasNewData ? mergedData : prevData;
      });
    }
  }, [cloudData, isLoaded]);

  return [data, setData];
};