import profilePhoto from "@/assets/profile-photo.jpg";
import { Mail, Github, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-hero px-4 py-20">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"></div>
            <img
              src={profilePhoto}
              alt="Профессиональное фото"
              className="relative w-48 h-48 rounded-full object-cover border-4 border-card shadow-card"
            />
          </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 tracking-tight">
          Эксперт по формированию команд
          <span className="block text-primary mt-2">бизнес-аналитиков</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Фанат AI инструментов. Помогаю компаниям создавать эффективные команды аналитиков
          и внедрять современные технологии.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="default"
            size="lg"
            className="gap-2 shadow-card hover:shadow-lg transition-all"
            asChild
          >
            <a href="mailto:your.email@example.com">
              <Mail className="w-5 h-5" />
              Email
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-primary/30 hover:bg-primary/5 transition-all"
            asChild
          >
            <a href="https://t.me/yourusername" target="_blank" rel="noopener noreferrer">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
              </svg>
              Telegram
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-primary/30 hover:bg-primary/5 transition-all"
            asChild
          >
            <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
              <Github className="w-5 h-5" />
              GitHub
            </a>
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="gap-2 shadow-card hover:shadow-lg transition-all"
            asChild
          >
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
              <FileText className="w-5 h-5" />
              Резюме (PDF)
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
