export const joinTalk = async (channel_id) => {
  try {
    window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: true }}));
    
    const response = await fetch(`/talks/join/${channel_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': document.querySelector('[name="csrf-token"]')?.content
      }
    });

    if (response.ok) {
      const { channel_id, access, token, username, video } = await response.json();
      window.renderAppBuilder(channel_id, access, token, username, false, video);
      return { success: true };
    } else {
      window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: false }}));
      console.error('Nie udało się dołączyć do audycji');
      return { success: false, error: 'Nie udało się dołączyć do audycji' };
    }
  } catch (error) {
    window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: false }}));
    console.error('Wystąpił błąd:', error);
    return { success: false, error: error.message };
  }
}; 