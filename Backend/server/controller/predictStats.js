const Log = require('../model/logSchema');

// GET /predict/stats
// Reads the Log collection and returns aggregated stats for the ModelStatus dashboard.
exports.getStats = async (req, res) => {
  try {
    // Sort by 'timestamp' — the actual field name in logSchema.js
    const logs = await Log.find().sort({ timestamp: -1 }).limit(500).lean();

    const empty = {
      totalPredictions:  0,
      avgConfidence:     0,
      highConfidenceRate: 0,
      lowConfidenceRate:  0,
      perCharStats:      [],
      last7Days:         [],
      recentPredictions: [],
    };

    if (!logs.length) {
      return res.status(200).json({ message: 'No predictions logged yet', data: empty });
    }

    // ── Overall ───────────────────────────────────────────────
    const totalPredictions = logs.length;
    const avgConfidence =
      logs.reduce((s, l) => s + (l.confidenceScore || 0), 0) / totalPredictions;

    const highConf = logs.filter((l) => (l.confidenceScore || 0) >= 0.65).length;
    const lowConf  = logs.filter((l) => (l.confidenceScore || 0) <  0.65).length;

    // ── Per-character breakdown ───────────────────────────────
    // Field is 'prededictedText' (typo in schema — kept as-is)
    const charMap = {};
    for (const l of logs) {
      const ch = (l.prededictedText || '?').toUpperCase();
      if (!charMap[ch]) charMap[ch] = { total: 0, confSum: 0 };
      charMap[ch].total   += 1;
      charMap[ch].confSum += l.confidenceScore || 0;
    }
    const perCharStats = Object.entries(charMap)
      .map(([ch, { total, confSum }]) => ({
        ch,
        avgConf: Math.round((confSum / total) * 100),
        count:   total,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // ── Last 7 days trend ─────────────────────────────────────
    // Uses 'timestamp' — the actual date field in logSchema.js
    const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = {};
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d   = new Date(now - i * 86_400_000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayMap[key] = { day: DAY_LABELS[d.getDay()], confSum: 0, count: 0 };
    }
    for (const l of logs) {
      const d   = new Date(l.timestamp);   // <-- 'timestamp', not 'createdAt'
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayMap[key]) {
        dayMap[key].confSum += l.confidenceScore || 0;
        dayMap[key].count   += 1;
      }
    }
    const last7Days = Object.values(dayMap).map((d) => ({
      day:   d.day,
      acc:   d.count ? Math.round((d.confSum / d.count) * 100) : null,
      count: d.count,
    }));

    // ── Recent 5 predictions ──────────────────────────────────
    const recentPredictions = logs.slice(0, 5).map((l) => ({
      char:       l.prededictedText || '?',         // 'prededictedText'
      confidence: Math.round((l.confidenceScore || 0) * 100),
      time:       l.timestamp,                       // 'timestamp'
    }));

    return res.status(200).json({
      message: 'Stats fetched successfully',
      data: {
        totalPredictions,
        avgConfidence:      Math.round(avgConfidence * 100),
        highConfidenceRate: Math.round((highConf / totalPredictions) * 100),
        lowConfidenceRate:  Math.round((lowConf  / totalPredictions) * 100),
        perCharStats,
        last7Days,
        recentPredictions,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
