function getDidAuthHeaders() {
    const key = process.env.DID_API_KEY || '';
    if (!key.includes(':')) {
        return { Authorization: 'Basic ' + Buffer.from(':').toString('base64') };
    }
    return { Authorization: 'Basic ' + Buffer.from(key).toString('base64') };
}

export const createStream = async (req, res) => {
    if (!process.env.DID_API_KEY) {
        return res.status(500).json({ detail: 'Missing D-ID Key' });
    }
    try {
        const response = await fetch('https://api.d-id.com/talks/streams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getDidAuthHeaders()
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
};

export const startStream = async (req, res) => {
    try {
        const response = await fetch(`https://api.d-id.com/talks/streams/${req.params.stream_id}/sdp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getDidAuthHeaders()
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
};

export const handleIce = async (req, res) => {
    try {
        const response = await fetch(`https://api.d-id.com/talks/streams/${req.params.stream_id}/ice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getDidAuthHeaders()
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
};

export const handleTalk = async (req, res) => {
    try {
        const response = await fetch(`https://api.d-id.com/talks/streams/${req.params.stream_id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getDidAuthHeaders()
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
};

export const deleteStream = async (req, res) => {
    try {
        const response = await fetch(`https://api.d-id.com/talks/streams/${req.params.stream_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...getDidAuthHeaders()
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
};
