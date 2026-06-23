
import img2 from "../images/dis2.jpg";
import img3 from "../images/dis3.jpg";
import img5 from "../images/shan1.jpg";
import img6 from "../images/shan2.jpg";
import pic1 from "../images/pic1.jpg";
import pic2 from "../images/pic2.jpg";
import pic3 from "../images/pic3.jpg";
import pic4 from "../images/pic4.jpg";
import pic5 from "../images/pic5.jpg";
import pic6 from "../images/pic6.jpg";
import pic7 from "../images/pic7.jpg";
import pic8 from "../images/pic8.jpg";
import pic9 from "../images/pic9.jpg";
import pic10 from "../images/pic10.jpg";
import pic11 from "../images/pic11.jpg";
import pic12 from "../images/pic12.jpg";
import pic13 from "../images/pic13.jpg";
import pic14 from "../images/pic14.jpg";
import pic15 from "../images/pic15.jpg";
import pic16 from "../images/pic16.jpg";
import pic17 from "../images/pic17.jpg";
import pic18 from "../images/pic18.jpg";
import pic19 from "../images/pic19.jpg";
import pic20 from "../images/pic20.jpg";

const images = [
  img2, img3, img5, img6,
  pic1, pic2, pic3, pic4, pic5,
  pic6, pic7, pic8, pic9, pic10,
  pic11, pic12, pic13, pic14, pic15,
  pic16, pic17, pic18, pic19, pic20,
];

const Gallery = () => {
  return (
    <div
      id="gallery"
      className="gallery-container"
      style={{
        padding: "35px 4vw", // Responsive padding
        maxWidth: "1500px",
        margin: "0 auto",
        borderRadius: "15px",
        boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.38)",
      }}
    >
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.5rem, 2.5vw, 2.5rem)",
          textAlign: "center",
          padding: "15px",
          marginBottom:"30px",
          borderRadius: "15px",
          boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.59)",
          color: "#0F8F46",
        }}
      >
        Our Gallery
      </h2>
     
      <div
  className="gallery-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    maxWidth: "1000px", // 4 * 220px to center 4 columns
    margin: "0 auto",  // center the grid
    gap: "16px",
  }}
>
        {images.map((src, index) => (
          <div
            key={index}
            style={{
              overflow: "hidden",
              borderRadius: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              aspectRatio: "1/1", // consistent square image boxes
            }}
          >
            <img
              src={src}
              alt={`gallery ${index + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Gallery;
