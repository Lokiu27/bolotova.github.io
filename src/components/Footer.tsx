const Footer = () => {
  return (
    <footer className="py-8 px-4 border-t border-border/50 bg-background">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-muted-foreground">
          © {new Date().getFullYear()} Эксперт по формированию команд бизнес-аналитиков
        </p>
      </div>
    </footer>
  );
};

export default Footer;
