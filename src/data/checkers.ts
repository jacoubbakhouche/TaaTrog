import checker1 from "@/assets/checker-1.jpg";
import checker2 from "@/assets/checker-2.jpg";
import checker3 from "@/assets/checker-3.jpg";
import checker4 from "@/assets/checker-4.jpg";
import checker5 from "@/assets/checker-5.jpg";
import checker6 from "@/assets/checker-6.jpg";

export interface Checker {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  image: string;
  testsCount: number;
  rating: number;
  reviewsCount: number;
  price: number;
  isOnline: boolean;
  languages: string[];
  description: string;
  socialMedia: string[];
}

export const checkers: Checker[] = [
  {
    id: "1",
    name: "Sara",
    age: 24,
    gender: "female",
    image: checker1,
    testsCount: 260,
    rating: 5.0,
    reviewsCount: 56,
    price: 66,
    isOnline: true,
    languages: ["English", "Spanish", "French"],
    description: "I've done over 200 loyalty tests. If they're cheating, we'll find out. And if they're truly loyal, you'll know too. I can always tell them I'm from where they're from.",
    socialMedia: ["instagram", "whatsapp", "snapchat"],
  },
  {
    id: "2",
    name: "Michael",
    age: 28,
    gender: "male",
    image: checker2,
    testsCount: 120,
    rating: 4.8,
    reviewsCount: 34,
    price: 55,
    isOnline: true,
    languages: ["English", "German"],
    description: "Expert at uncovering the truth. Professional and discreet approach to every test.",
    socialMedia: ["instagram", "facebook", "whatsapp"],
  },
  {
    id: "3",
    name: "Elena",
    age: 26,
    gender: "female",
    image: checker3,
    testsCount: 180,
    rating: 4.9,
    reviewsCount: 42,
    price: 70,
    isOnline: false,
    languages: ["English", "Italian", "Portuguese"],
    description: "Highly experienced in loyalty testing. Your privacy is my priority.",
    socialMedia: ["instagram", "snapchat"],
  },
  {
    id: "4",
    name: "James",
    age: 30,
    gender: "male",
    image: checker4,
    testsCount: 95,
    rating: 4.7,
    reviewsCount: 28,
    price: 50,
    isOnline: true,
    languages: ["English", "French"],
    description: "Straightforward and honest. I'll get you the answers you need.",
    socialMedia: ["instagram", "whatsapp", "tiktok"],
  },
  {
    id: "5",
    name: "Yuki",
    age: 23,
    gender: "female",
    image: checker5,
    testsCount: 145,
    rating: 4.9,
    reviewsCount: 38,
    price: 60,
    isOnline: true,
    languages: ["English", "Japanese", "Korean"],
    description: "Specialized in social media approaches. Very high success rate.",
    socialMedia: ["instagram", "snapchat", "whatsapp"],
  },
  {
    id: "6",
    name: "Carlos",
    age: 25,
    gender: "male",
    image: checker6,
    testsCount: 88,
    rating: 4.6,
    reviewsCount: 22,
    price: 45,
    isOnline: false,
    languages: ["English", "Spanish", "Portuguese"],
    description: "Friendly approach that puts targets at ease. Get real results.",
    socialMedia: ["instagram", "facebook", "whatsapp"],
  },
];
