export const getSourceStyle = (sourceName: string) => {
  const name = sourceName?.toLowerCase() || "";

  if (name.includes("google")) {
    return {
      background: "linear-gradient(135deg, #4285F4 0% 25%, #EA4335 25% 50%, #FBBC05 50% 75%, #34A853 75% 100%)",
      icon: "G",
    };
  } else if (name.includes("openai")) {
    return {
      background: "linear-gradient(135deg, #10a37f, #007c66)",
      icon: "O",
    };
  } else if (name.includes("github")) {
    return {
      background: "linear-gradient(135deg, #24292e, #6e7681)",
      icon: "GH",
    };
  } else if (name.includes("zenn")) {
    return {
      background: "linear-gradient(135deg, #3ea8ff, #007bb6)",
      icon: "Zn",
    };
  } else if (name.includes("qiita")) {
    return {
      background: "linear-gradient(135deg, #55c500, #2da600)",
      icon: "Qi",
    };
  } else {
    return {
      background: "linear-gradient(135deg, #6c757d, #adb5bd)",
      icon: sourceName.slice(0, 1).toUpperCase() || "?",
    };
  }
};