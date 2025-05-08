export const formatDate = (isoString) => {
    const date = new Date(isoString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
  };
  