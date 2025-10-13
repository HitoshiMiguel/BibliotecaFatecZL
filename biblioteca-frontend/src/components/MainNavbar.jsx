// Arquivo: src/components/MainNavbar.jsx
'use client';

import { useState } from 'react'; // 👈 1. Precisamos do useState
import { Navbar, Nav, NavDropdown, Container } from 'react-bootstrap';
import Link from 'next/link';

export default function MainNavbar({ className }) {
  // 2. Criamos um estado para cada menu dropdown
  const [showInstitucional, setShowInstitucional] = useState(false);
  const [showCursos, setShowCursos] = useState(false);
  const [showAreaAluno, setShowAreaAluno] = useState(false);
  const [showProfessores, setShowProfessores] = useState(false);
  const [showSecretaria, setShowSecretaria] = useState(false);
  const [showBiblioteca, setShowBiblioteca] = useState(false);

  const NavLink = ({ href, children }) => (
    <Nav.Link as={Link} href={href}>{children}</Nav.Link>
  );
  const DropdownItem = ({ href, children }) => (
    <NavDropdown.Item as={Link} href={href}>{children}</NavDropdown.Item>
  );

  return (
    <Navbar expand="lg" className={className} variant="dark">
      <Container>
        <Navbar.Toggle aria-controls="navbar-fatec-zl" />
        <Navbar.Collapse id="navbar-fatec-zl">
          <Nav className="mx-auto">
            <NavLink href="/">Início</NavLink>

            {/* 3. Adicionamos as propriedades show, onMouseEnter, onMouseLeave */}
            <NavDropdown 
              title="Institucional" 
              id="dropdown-institucional"
              show={showInstitucional}
              onMouseEnter={() => setShowInstitucional(true)}
              onMouseLeave={() => setShowInstitucional(false)}
            >
              <DropdownItem href="#">CPA</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">e-MEC</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Congregação</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Revista @_Git</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Engetec em Revista</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">A Fatec Zona Leste</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Informativo GetLeste</DropdownItem>
            </NavDropdown>

            <NavDropdown 
              title="Cursos" 
              id="dropdown-cursos"
              show={showCursos}
              onMouseEnter={() => setShowCursos(true)}
              onMouseLeave={() => setShowCursos(false)}
            >
              <DropdownItem href="#">AMS - Análise e Desenvolvimento de Sistemas</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Análise e Desenvolvimento de Sistemas</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Comércio Exterior</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Desenvolvimento de Produtos Plasticos</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Desenvolvimento de Software em Multiplataforma</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Gestão de Recursos Humanos</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Gestão Empresarial</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Logística</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Polímeros</DropdownItem>
              <NavDropdown.Divider />
            </NavDropdown>
            
            <NavLink href="#">Vestibular</NavLink>

            <NavDropdown 
              title="Área do Aluno" 
              id="dropdown-area-aluno"
              show={showAreaAluno}
              onMouseEnter={() => setShowAreaAluno(true)}
              onMouseLeave={() => setShowAreaAluno(false)}
            >
              <DropdownItem href="#">EAD</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">SIGA</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Estágio</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Atlética</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Calendário Acadêmico</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Transferência e Vagas Remanescentes</DropdownItem>
            </NavDropdown>
            
            <NavDropdown 
              title="Professores" 
              id="dropdown-professores"
              show={showProfessores}
              onMouseEnter={() => setShowProfessores(true)}
              onMouseLeave={() => setShowProfessores(false)}
            >
              <DropdownItem href="#">SIGA</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">HAE</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Solicitar Reserva de Laboratório</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Editais de Ampliação de Aula</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Processos Seletivos e Concursos</DropdownItem>
            </NavDropdown>

            <NavDropdown 
              title="Secretaria" 
              id="dropdown-secretaria"
              show={showSecretaria}
              onMouseEnter={() => setShowSecretaria(true)}
              onMouseLeave={() => setShowSecretaria(false)}
            >
              <DropdownItem href="#">Informações da Secretaria</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="#">Solicitações para a Secretaria</DropdownItem>
            </NavDropdown>

            <NavDropdown 
              title="Biblioteca" 
              id="dropdown-biblioteca"
              show={showBiblioteca}
              onMouseEnter={() => setShowBiblioteca(true)}
              onMouseLeave={() => setShowBiblioteca(false)}
            >
              <DropdownItem href="#">Informações da Biblioteca</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="/siteFatec">Informações da Biblioteca Online</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="/consulta">Consultar Acervo</DropdownItem>
              <NavDropdown.Divider />
              <DropdownItem href="/login">Login / Meus Dados</DropdownItem>
            </NavDropdown>

            <NavLink href="#">E-Mail Institucional</NavLink>
            <NavLink href="#">Suporte DTI</NavLink>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}