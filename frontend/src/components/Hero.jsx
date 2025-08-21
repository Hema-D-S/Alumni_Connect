const Hero = () => {
  return (
    <section
      className="relative w-full h-screen flex items-center justify-center text-white bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/home.avif')" }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
          Welcome to Alumni Connect
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl mx-auto">
          Connecting alumni and students to build a stronger professional
          community, share experiences, and grow together.
        </p>
      </div>
    </section>
  );
};

export default Hero;
