export const detectSource = (url) => {
  if (/youtube\.com|youtu\.be/i.test(url)) return "YouTube";
  if (/drive\.google\.com/i.test(url)) return "Google Drive";
  return "Other";
};

export const detectTopics = (raw = "") => {
  const text = raw.toLowerCase();
  const topicMap = [
    ["instagram", "Instagram Marketing"], ["facebook", "Facebook Marketing"],
    ["social media", "Social Media"], ["wordpress", "WordPress"],
    ["email", "Email Marketing"], ["seo", "SEO"], ["google ads", "Google Ads"],
    ["meta ads", "Meta Ads"], ["content", "Content Strategy"], ["analytics", "Analytics"],
    ["ai", "AI Marketing"], ["automation", "Automation"], ["branding", "Branding"],
    ["copywriting", "Copywriting"], ["lead generation", "Lead Generation"]
  ];
  const topics = topicMap.filter(([key]) => text.includes(key)).map(([, label]) => label);
  return topics.length ? [...new Set(topics)] : ["AI topic indexing"];
};

const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
const cleanUrl = (url) => url.replace(/[),.;]+$/, "");

export const parseRecordings = (text = "") => {
  const lines = text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const urls = [...text.matchAll(urlRegex)].map(m => cleanUrl(m[1]));
  if (!urls.length) return [];

  return urls.map((url, index) => {
    const nearby = lines.filter(line => !/^https?:\/\//i.test(line)).slice(Math.max(0, index - 2), index + 2);
    const dayMatch = text.match(/\bday\s*[-:#]?\s*(\d{1,3})\b/i);
    const day = Number(dayMatch?.[1] || 0);
    const title = nearby.find(line => !/^day\b/i.test(line) && !/https?:\/\//i.test(line)) || `Day ${day || ""} Lecture ${index + 1}`;
    const source = detectSource(url);
    return { day, title, original: nearby.join(" | "), url, source, topics: detectTopics(`${title} ${nearby.join(" ")}`) };
  });
};
