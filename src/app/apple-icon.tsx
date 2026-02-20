import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Image metadata
export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="30" height="30" rx="4" fill="white" />
      <path
        d="M12 17C12 18.657 14.686 20 18 20C21.314 20 24 18.657 24 17M12 17C12 15.343 14.686 14 18 14C21.314 14 24 15.343 24 17M12 17V21C12 22.656 14.686 24 18 24C21.314 24 24 22.656 24 21V17M6 9C6 10.072 7.144 11.062 9 11.598C10.856 12.134 13.144 12.134 15 11.598C16.856 11.062 18 10.072 18 9C18 7.928 16.856 6.938 15 6.402C13.144 5.866 10.856 5.866 9 6.402C7.144 6.938 6 7.928 6 9ZM6 9V19C6 19.888 6.772 20.45 8 21M6 14C6 14.888 6.772 15.45 8 16"
        stroke="black"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>,
    // ImageResponse options
    {
      ...size,
    },
  );
}
