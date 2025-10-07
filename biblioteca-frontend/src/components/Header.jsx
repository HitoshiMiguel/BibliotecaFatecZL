// Arquivo: src/components/Header.jsx
import Image from 'next/image'; // Componente de imagem otimizado do Next.js

export default function Header({pageTitle}) {
  return (
    <header className="app-header">
      {/* Faixa superior (governo) - classes do seu globals.css */}
      <div className="govsp-header">
        <div className="logo-governo">
          {/* Ajuste o caminho se o nome da imagem for diferente */}
          <Image 
            src="/imagens/logo-governo.png" 
            alt="Logo Governo de SP" 
            className="logo-governo-img"
            width={160}
            height={38}
            priority/>
        </div>
        <div className="icones">
            <Image src="/imagens/i-flickr.png" alt="Logo Flickr" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-linkedin.png" alt="Logo Linkedin" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-tiktok.png" alt="Logo Tiktok" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-youtube.png" alt="Logo Youtube" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-twitter.png" alt="Logo Twitter" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-instagram.png" alt="Logo Instagram" className="icone-img" width={25} height={25} />
            <Image src="/imagens/i-facebook.png" alt="Logo Facebook" className="icone-img" width={25} height={25} />
          <span className="govsp">/governosp</span>
        </div>
      </div>

      {/* Faixa inferior (Fatec/CPS) - classes do seu globals.css */}
      <div className="CPS-header">
        <div className="CPS-container">
          <div className="logos">
            {/* Ajuste os caminhos das imagens */}
            <Image 
                src="/imagens/logo-fatec-cps.png" 
                alt="Logo FATEC Zona Leste" 
                className="logo-cps-fatec-img" 
                width={310}
                height={85}
                priority/>
          </div>
          {/* Adicione o menu hamburguer se necessário */}
        </div>

    <section className="page-title-section">
        <h1>{pageTitle}</h1>
    </section>   

      </div>
    </header>
  );
}