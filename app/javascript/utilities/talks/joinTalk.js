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
      console.error('Failed to join the broadcast');
      return { success: false, error: 'Failed to join the broadcast' };
    }
  } catch (error) {
    window.dispatchEvent(new CustomEvent('joiningTalk', { detail: { joining: false }}));
    console.error('An error occurred:', error);
    return { success: false, error: error.message };
  }
}; 