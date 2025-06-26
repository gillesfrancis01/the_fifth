
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
  
    const weekdays = [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ];
  
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
  
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  const formatHour = (dateString: string): string => {
    const date = new Date(dateString);
  
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
  
    hours = hours % 12 || 12; // convert 0 -> 12, 13 -> 1, etc.
    const formattedHours = String(hours).padStart(2, '0');
  
    return `${formattedHours}:${minutes} ${ampm}`;
  };
  
  
  export { formatDate, formatHour };
  