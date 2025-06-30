'use client'

import * as React from 'react';
import Image from 'next/image'
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/permanent-marker';
import { Box, Stack } from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import AutoStories from '@mui/icons-material/AutoStories';
import School from '@mui/icons-material/school';
import Dashboard from '@mui/icons-material/dashboard';
import Handshake from '@mui/icons-material/handshake';


export default function Home() {
    return (
        <Box>
            <Container 
                maxWidth="false"
                component={"section"}
                classes={{ root: "landingpage" }}
                sx={{
                    p: 2,
                    minWidth: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vmin',
                    backgroundImage: (theme) =>
                        `linear-gradient(to right, ${theme.palette.hero.start}, ${theme.palette.hero.end})`,
                    }}>
                <Typography variant="h2" component="h1" gutterBottom sx={{ fontFamily: 'Permanent Marker'}}>
                    The Historian
                </Typography>
                <Typography variant="h5" component="h2" gutterBottom maxWidth={600} align='center'>
                    Ein Tool für alle, die Zeitgeschichte, Ahnenforschung oder historische Zusammenhänge greifbar machen wollen – präzise, strukturiert und visuell.            
                </Typography>
            </Container>
            <Container maxWidth="lg" sx={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }} component={"section"}>
                <Typography variant="h3" component="h2" gutterBottom align='center' sx={{ fontFamily: 'Permanent Marker' }}>
                    Unsere Ziele
                </Typography>
                <Typography variant="h5" component="p" gutterBottom align='center'>
                    Viele, die sich mit Geschichte beschäftigen, stoßen irgendwann auf dasselbe Problem:
                </Typography>
                <Stack spacing={5} direction="row">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Dashboard color='secondary' sx={{ fontSize: 60 }} />
                        <Typography variant="h6" component="p" gutterBottom align='center'>
                        Wie halte ich den Überblick über die Vielzahl an Informationen, die ich zusammentrage?
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <AutoStories color='secondary' sx={{ fontSize: 60 }} /> 
                        <Typography variant="h6" component="p" gutterBottom align='center'>
                            Wie dokumentiere ich Beziehungen zwischen Menschen, Ereignissen und Orten?
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <Handshake color='secondary' sx={{ fontSize: 60 }} /> 
                        <Typography variant="h6" component="p" gutterBottom align='center'>
                            Wie finde ich heraus, was miteinander verknüpft ist – und wann genau?
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <School color='secondary' sx={{ fontSize: 60 }} />
                        <Typography variant="h6" component="p" gutterBottom align='center'>
                            Wie kann ich meine Daten so aufbereiten, dass sie für andere verständlich sind?
                        </Typography>
                    </Box>
                </Stack>
            </Container>
            <Container maxWidth="lg" sx={{ padding: 6, display: 'flex', flexDirection: 'column', alignItems:'center', gap: 4 }} component={"section"}>
                <Typography variant="h3" component="h2" gutterBottom align='center' sx={{ fontFamily: 'Permanent Marker' }}>
                    Funktionen
                </Typography>
                <List component="ul" sx={{ width: '100%', maxWidth: 600, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', gap: 4 }} component="nav" aria-label="main mailbox folders">
                    <ListItem alignItems="center" sx={{ gap: 4 }}>
                        <ListItemAvatar>
                            <Image
                                src="/undraw_data-input.svg"
                                width={200}
                                height={200}
                                alt="Hellooo"
                                loading="lazy"
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="h5" gutterBottom component="h3">
                                    Personen, Orte und Ereignisse erfassen
                                </Typography>
                            }
                            secondary={
                                <React.Fragment>
                                <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{ color: 'text.primary', display: 'inline' }}
                                >
                                    Erstelle einzelne Einträge mit allen relevanten Informationen – z. B. Geburtsort, Wirkungszeitraum oder historische Bedeutung. Alles bleibt klar voneinander trennbar, aber miteinander verknüpfbar.
                                </Typography>
                            
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem alignItems="center" sx={{ gap: 4, flexDirection: 'row-reverse' }}>
                        <ListItemAvatar>
                            <Image
                                src="/undraw_mind-map.svg"
                                width={200}
                                height={200}
                                alt="Hellooo"
                                loading="lazy"
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="h5" gutterBottom component="h3">
                                     Beziehungen und Zusammenhänge darstellen
                                </Typography>
                            }
                            secondary={
                                <React.Fragment>
                                <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{ color: 'text.primary', display: 'inline' }}
                                >
                                    Verknüpfe Elemente logisch: Wer war mit wem verwandt, beteiligt oder zur selben Zeit am selben Ort? Die Datenstruktur ermöglicht es, auch komplexe historische Konstellationen greifbar zu machen.

                                </Typography>
                            
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem alignItems="center" sx={{ gap: 4 }}>
                        <ListItemAvatar>
                            <Image
                                src="/undraw_personal-information.svg"
                                width={200}
                                height={200}
                                alt="Hellooo"
                                loading="lazy"
                            />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography variant="h5" gutterBottom component="h3">
                                    Eigene Daten sicher verwalten
                                </Typography>
                            }
                            secondary={
                                <React.Fragment>
                                <Typography
                                    component="span"
                                    variant="body1"
                                    sx={{ color: 'text.primary', display: 'inline' }}
                                >
                                    Deine Daten gehören dir: Jede:r Nutzer:in arbeitet zunächst im eigenen, geschützten Raum. Eine spätere Freigabe oder Zusammenarbeit ist möglich, aber freiwillig.
                                </Typography>
                            
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                </List>
            </Container>
            <Container maxWidth="lg" sx={{ padding: 6, display: 'flex', flexDirection: 'column', alignItems:'center', gap: 4 }} component={"section"}>
                
                <Container
                    maxWidth="md"
                    sx={{
                        padding: 4,
                        borderRadius: 2,
                        backgroundImage: (theme) =>
                            `linear-gradient(to right, ${theme.palette.hero.start}, ${theme.palette.hero.end})`,
                        }}>
                    <Typography variant="h3" component="h2" gutterBottom align='center' sx={{ fontFamily: 'Permanent Marker' }}>
                        Über mich
                    </Typography>
                    <Typography variant="h6" component="p" gutterBottom>
                        Ich bin [Vorname], UX- und Webdesigner:in mit einem kulturwissenschaftlichen Hintergrund.
                        Aus eigener Frustration über unhandliche Tools und dem Wunsch, historische Informationen wirklich greifbar zu machen, baue ich dieses Projekt.
                        Schritt für Schritt – und mit offenem Ohr für Feedback.
                    </Typography>
                </Container>
            </Container>
            <Container 
                maxWidth="false"
                component={"section"}
                classes={{ root: "landingpage" }}
                sx={{
                    p: 2,
                    minWidth: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 6,
                    backgroundImage: (theme) =>
                        `linear-gradient(to right, ${theme.palette.hero.start}, ${theme.palette.hero.end})`,
                    }}>
                <Typography variant="h2" component="h2" gutterBottom align='center' sx={{ fontFamily: 'Permanent Marker' }}>
                    Bleib informiert!
                </Typography>
                <Typography variant="h5" component="p" gutterBottom sx={{ maxWidth: '50ch'}}>    
                ✉️ Trage dich ein, wenn du informiert werden willst, sobald die erste Testversion online ist.
                💬 Oder schreib mir gern, wenn du Ideen, Wünsche oder Herausforderungen aus deinem Bereich teilen willst.
                </Typography>
                <Button variant="contained" color="secondary" href="#">
                    Kontakt aufnehmen
                </Button>

            </Container>
        </Box>
        
    );
}